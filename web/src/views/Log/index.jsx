import { useCallback, useEffect, useState } from 'react'
import { renderNumber, renderQuota, showError, showSuccess, trims, useIsAdmin } from 'utils/common'

import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import PerfectScrollbar from 'react-perfect-scrollbar'
import TablePagination from '@mui/material/TablePagination'
import LinearProgress from '@mui/material/LinearProgress'
import ButtonGroup from '@mui/material/ButtonGroup'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import LogTableRow from './component/TableRow'
import KeywordTableHead from 'ui-component/TableHead'
import TableToolBar from './component/TableToolBar'
import { API } from 'utils/api'
import { getPageSize, PAGE_SIZE_OPTIONS, savePageSize } from 'constants'
import { Icon } from '@iconify/react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import { useLogType } from './type/LogType'

const emptyLogStats = {
  quota: 0,
  request_count: 0,
  success_count: 0,
  failure_count: 0,
  failure_rate: 0,
  prompt_tokens: 0,
  completion_tokens: 0,
  avg_request_time: 0,
  avg_rpm: 0,
  avg_tpm: 0,
  time_span_seconds: 0
}

export default function Log() {
  const { t } = useTranslation()
  const LogType = useLogType()
  const originalKeyword = {
    p: 0,
    username: '',
    token_name: '',
    model_name: '',
    start_timestamp: dayjs().startOf('day').unix(),
    end_timestamp: dayjs().unix() + 3600,
    log_type: '0',
    channel_id: '',
    source_ip: ''
  }

  const [page, setPage] = useState(0)
  const [order, setOrder] = useState('desc')
  const [orderBy, setOrderBy] = useState('created_at')
  const [rowsPerPage, setRowsPerPage] = useState(() => getPageSize('log'))
  const [listCount, setListCount] = useState(0)
  const [searching, setSearching] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [toolBarValue, setToolBarValue] = useState(originalKeyword)
  const [searchKeyword, setSearchKeyword] = useState(originalKeyword)
  const [logStats, setLogStats] = useState(emptyLogStats)
  const [refreshFlag, setRefreshFlag] = useState(false)
  const { userGroup } = useSelector((state) => state.account)
  const theme = useTheme()
  const matchUpMd = useMediaQuery(theme.breakpoints.up('sm'))

  const [logs, setLogs] = useState([])
  const userIsAdmin = useIsAdmin()

  // 添加列显示设置相关状态
  const [columnVisibility, setColumnVisibility] = useState({
    created_at: true,
    channel_id: true,
    user_id: true,
    group: true,
    token_name: true,
    type: true,
    model_name: true,
    duration: true,
    message: true,
    completion: true,
    quota: true,
    source_ip: true,
    detail: true
  })
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null)

  // 处理列显示菜单打开和关闭
  const handleColumnMenuOpen = (event) => {
    setColumnMenuAnchor(event.currentTarget)
  }

  const handleColumnMenuClose = () => {
    setColumnMenuAnchor(null)
  }

  // 处理列显示状态变更
  const handleColumnVisibilityChange = (columnId) => {
    setColumnVisibility({
      ...columnVisibility,
      [columnId]: !columnVisibility[columnId]
    })
  }

  // 处理全选/取消全选列显示
  const handleSelectAllColumns = () => {
    const allColumns = Object.keys(columnVisibility)
    const areAllVisible = allColumns.every((column) => columnVisibility[column])

    const newColumnVisibility = {}
    allColumns.forEach((column) => {
      newColumnVisibility[column] = !areAllVisible
    })

    setColumnVisibility(newColumnVisibility)
  }

  const handleSort = (event, id) => {
    const isAsc = orderBy === id && order === 'asc'
    if (id !== '') {
      setOrder(isAsc ? 'desc' : 'asc')
      setOrderBy(id)
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10)
    setPage(0)
    setRowsPerPage(newRowsPerPage)
    savePageSize('log', newRowsPerPage)
  }

  const searchLogs = async() => {
    // 如果正在搜索中，防止重复提交
    if (searching) {
      return
    }

    setPage(0)
    // 使用时间戳来确保即使搜索条件相同也能触发重新搜索
    const searchPayload = {
      ...toolBarValue,
      _timestamp: Date.now()
    }
    setSearchKeyword(searchPayload)
  }

  const handleToolBarValue = (event) => {
    setToolBarValue({ ...toolBarValue, [event.target.name]: event.target.value })
  }

  const handleTabsChange = async(event, newValue) => {
    const updatedToolBarValue = { ...toolBarValue, log_type: newValue }
    setToolBarValue(updatedToolBarValue)
    setPage(0)
    setSearchKeyword(updatedToolBarValue)
  }

  const buildFilterParams = useCallback((keyword) => {
    const requestKeyword = trims(keyword)

    if (requestKeyword._timestamp) {
      delete requestKeyword._timestamp
    }

    if (!userIsAdmin) {
      delete requestKeyword.username
      delete requestKeyword.channel_id
    }

    return requestKeyword
  }, [userIsAdmin])

  const fetchData = useCallback(
    async(page, rowsPerPage, keyword, order, orderBy) => {
      setSearching(true)
      const requestKeyword = buildFilterParams(keyword)

      try {
        if (orderBy) {
          orderBy = order === 'desc' ? '-' + orderBy : orderBy
        }
        const url = userIsAdmin ? '/api/log/' : '/api/log/self/'

        const res = await API.get(url, {
          params: {
            page: page + 1,
            size: rowsPerPage,
            order: orderBy,
            ...requestKeyword
          }
        })
        const { success, message, data } = res.data
        if (success) {
          setListCount(data.total_count)
          setLogs(data.data)
        } else {
          showError(message)
        }
      } catch (error) {
        console.error(error)
      }
      setSearching(false)
    },
    [buildFilterParams, userIsAdmin]
  )

  const fetchStats = useCallback(async(keyword) => {
    setStatsLoading(true)

    try {
      const url = userIsAdmin ? '/api/log/stat' : '/api/log/self/stat'
      const res = await API.get(url, {
        params: buildFilterParams(keyword)
      })
      const { success, message, data } = res.data
      if (success) {
        setLogStats({ ...emptyLogStats, ...data })
      } else {
        showError(message)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setStatsLoading(false)
    }
  }, [buildFilterParams, userIsAdmin])

  // 处理刷新
  const handleRefresh = async() => {
    setOrderBy('created_at')
    setOrder('desc')
    setToolBarValue(originalKeyword)
    setSearchKeyword(originalKeyword)
    setRefreshFlag(!refreshFlag)
  }

  // 导出状态
  const [exporting, setExporting] = useState(false)

  // 处理导出
  const handleExport = useCallback(async () => {
    if (exporting) return // 防止重复点击

    setExporting(true)
    try {
      const exportKeyword = buildFilterParams(searchKeyword)

      let orderBy_export = orderBy
      if (orderBy_export) {
        orderBy_export = order === 'desc' ? '-' + orderBy_export : orderBy_export
      }

      const url = userIsAdmin ? '/api/log/export' : '/api/log/self/export'
      const params = {
        order: orderBy_export,
        ...exportKeyword
      }

      // 使用fetch进行同步请求，提供更好的错误处理
      const queryString = new URLSearchParams(params).toString()
      const downloadUrl = `${url}?${queryString}`

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `logs_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // 创建blob并下载
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(link.href)

      showSuccess(t('logPage.exportSuccess'))
    } catch (error) {
      console.error('Export error:', error)
      showError(t('logPage.exportError') + ': ' + error.message)
    } finally {
      setExporting(false)
    }
  }, [buildFilterParams, searchKeyword, order, orderBy, userIsAdmin, t, exporting])

  useEffect(() => {
    fetchData(page, rowsPerPage, searchKeyword, order, orderBy)
  }, [page, rowsPerPage, searchKeyword, order, orderBy, fetchData, refreshFlag])

  useEffect(() => {
    fetchStats(searchKeyword)
  }, [searchKeyword, fetchStats])

  const summaryCards = [
    {
      title: t('logPage.summaryQuota'),
      value: renderQuota(logStats.quota || 0, 6)
    },
    {
      title: t('logPage.summaryRequests'),
      value: renderNumber(logStats.request_count || 0)
    },
    {
      title: t('logPage.summarySuccess'),
      value: renderNumber(logStats.success_count || 0)
    },
    {
      title: t('logPage.summaryFailure'),
      value: `${renderNumber(logStats.failure_count || 0)} · ${formatPercentage(logStats.failure_rate)}`
    },
    {
      title: t('logPage.summaryAvgRPM'),
      value: formatThroughput(logStats.avg_rpm)
    },
    {
      title: t('logPage.summaryAvgTPM'),
      value: formatThroughput(logStats.avg_tpm)
    },
    {
      title: t('logPage.summaryAvgDuration'),
      value: formatDuration(logStats.avg_request_time)
    }
  ]

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Stack direction="column" spacing={1}>
          <Typography variant="h2">{t('logPage.title')}</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Log
          </Typography>
        </Stack>
      </Stack>
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={toolBarValue.log_type}
            onChange={handleTabsChange}
            aria-label="basic tabs example"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            {Object.values(LogType).map((option) => {
              return <Tab key={option.value} label={option.text} value={option.value}/>
            })}
          </Tabs>
        </Box>
        <Box component="form" noValidate>
          <TableToolBar filterName={toolBarValue} handleFilterName={handleToolBarValue} userIsAdmin={userIsAdmin}
                        onSearch={searchLogs}/>
        </Box>
        <Toolbar
          sx={{
            textAlign: 'right',
            height: 50,
            display: 'flex',
            justifyContent: 'space-between',
            p: (theme) => theme.spacing(0, 1, 0, 3)
          }}
        >
          <Container maxWidth="xl">
            {matchUpMd ? (
              <ButtonGroup variant="outlined" aria-label="outlined small primary button group">
                <Button onClick={handleRefresh} startIcon={<Icon icon="solar:refresh-circle-bold-duotone" width={18}/>}>
                  {t('logPage.refreshButton')}
                </Button>

                <Button
                  onClick={searchLogs}
                  size="small"
                  startIcon={
                    searching ? (
                      <Icon
                        icon="solar:refresh-bold-duotone"
                        width={18}
                        style={{
                          animation: 'spin 1s linear infinite',
                          color: '#1976d2'
                        }}
                      />
                    ) : (
                      <Icon icon="solar:minimalistic-magnifer-line-duotone" width={18}/>
                    )
                  }
                  sx={{
                    ...(searching && {
                      bgcolor: 'action.hover',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'action.selected'
                      }
                    })
                  }}
                >
                  {searching ? t('logPage.searching') : t('logPage.searchButton')}
                </Button>

                <Button
                  onClick={exporting ? undefined : handleExport}
                  size="small"
                  startIcon={
                    exporting ? (
                      <Icon
                        icon="solar:refresh-bold-duotone"
                        width={18}
                        style={{
                          animation: 'spin 1s linear infinite',
                          color: '#1976d2'
                        }}
                      />
                    ) : (
                      <Icon icon="solar:download-bold-duotone" width={18}/>
                    )
                  }
                  sx={{
                    ...(exporting && {
                      bgcolor: 'action.hover',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'action.selected'
                      }
                    })
                  }}
                >
                  {exporting ? t('logPage.exporting') : t('logPage.exportButton')}
                </Button>

                <Button onClick={handleColumnMenuOpen} size="small"
                        startIcon={<Icon icon="solar:settings-bold-duotone" width={18}/>}>
                  {t('logPage.columnSettings')}
                </Button>
              </ButtonGroup>
            ) : (
              <Stack
                direction="row"
                spacing={1}
                divider={<Divider orientation="vertical" flexItem/>}
                justifyContent="space-around"
                alignItems="center"
              >
                <IconButton onClick={handleRefresh} size="small">
                  <Icon icon="solar:refresh-circle-bold-duotone" width={18}/>
                </IconButton>
                <IconButton
                  onClick={searchLogs}
                  size="small"
                  sx={{
                    ...(searching && {
                      bgcolor: 'action.hover',
                      color: 'primary.main'
                    })
                  }}
                >
                  {searching ? (
                    <Icon
                      icon="solar:refresh-bold-duotone"
                      width={18}
                      style={{
                        animation: 'spin 1s linear infinite',
                        color: '#1976d2'
                      }}
                    />
                  ) : (
                    <Icon icon="solar:minimalistic-magnifer-line-duotone" width={18}/>
                  )}
                </IconButton>
                <IconButton
                  onClick={exporting ? undefined : handleExport}
                  size="small"
                  sx={{
                    ...(exporting && {
                      bgcolor: 'action.hover',
                      color: 'primary.main'
                    })
                  }}
                >
                  {exporting ? (
                    <Icon
                      icon="solar:refresh-bold-duotone"
                      width={18}
                      style={{
                        animation: 'spin 1s linear infinite',
                        color: '#1976d2'
                      }}
                    />
                  ) : (
                    <Icon icon="solar:download-bold-duotone" width={18}/>
                  )}
                </IconButton>
                <IconButton onClick={handleColumnMenuOpen} size="small">
                  <Icon icon="solar:settings-bold-duotone" width={18}/>
                </IconButton>
              </Stack>
            )}

            <Menu
              anchorEl={columnMenuAnchor}
              open={Boolean(columnMenuAnchor)}
              onClose={handleColumnMenuClose}
              PaperProps={{
                style: {
                  maxHeight: 300,
                  width: 200
                }
              }}
            >
              <MenuItem disabled>
                <Typography variant="subtitle2">{t('logPage.selectColumns')}</Typography>
              </MenuItem>
              <MenuItem onClick={handleSelectAllColumns} dense>
                <Checkbox
                  checked={Object.values(columnVisibility).every((visible) => visible)}
                  indeterminate={
                    !Object.values(columnVisibility).every((visible) => visible) &&
                    Object.values(columnVisibility).some((visible) => visible)
                  }
                  size="small"
                />
                <ListItemText primary={t('logPage.columnSelectAll')}/>
              </MenuItem>
              {[
                { id: 'created_at', label: t('logPage.timeLabel') },
                { id: 'channel_id', label: t('logPage.channelLabel'), adminOnly: true },
                { id: 'user_id', label: t('logPage.userLabel'), adminOnly: true },
                { id: 'group', label: t('logPage.groupLabel') },
                { id: 'token_name', label: t('logPage.tokenLabel') },
                { id: 'type', label: t('logPage.typeLabel') },
                { id: 'model_name', label: t('logPage.modelLabel') },
                { id: 'duration', label: t('logPage.durationLabel') },
                { id: 'message', label: t('logPage.inputLabel') },
                { id: 'completion', label: t('logPage.outputLabel') },
                { id: 'quota', label: t('logPage.quotaLabel') },
                { id: 'source_ip', label: t('logPage.sourceIp') },
                { id: 'detail', label: t('logPage.detailLabel') }
              ].map(
                (column) =>
                  (!column.adminOnly || userIsAdmin) && (
                    <MenuItem key={column.id} onClick={() => handleColumnVisibilityChange(column.id)} dense>
                      <Checkbox checked={columnVisibility[column.id] || false} size="small"/>
                      <ListItemText primary={column.label}/>
                    </MenuItem>
                  )
              )}
            </Menu>
          </Container>
        </Toolbar>
        <Box sx={{ px: 3, pb: 2.25 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t('logPage.summarySectionTitle')}
            </Typography>
          </Stack>
          {statsLoading && <LinearProgress sx={{ mb: 1.25, borderRadius: 999 }}/>}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            {summaryCards.map((card) => (
              <Box
                key={card.title}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 999,
                  px: 1.5,
                  py: 0.875,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'background.default',
                  minHeight: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, lineHeight: 1.2 }}
                >
                  {card.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}
                >
                  {card.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        {searching && <LinearProgress/>}
        <PerfectScrollbar component="div">
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <KeywordTableHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleSort}
                headLabel={[
                  {
                    id: 'created_at',
                    label: t('logPage.timeLabel'),
                    disableSort: false,
                    hide: !columnVisibility.created_at
                  },
                  {
                    id: 'channel_id',
                    label: t('logPage.channelLabel'),
                    disableSort: false,
                    hide: !columnVisibility.channel_id || !userIsAdmin
                  },
                  {
                    id: 'user_id',
                    label: t('logPage.userLabel'),
                    disableSort: false,
                    hide: !columnVisibility.user_id || !userIsAdmin
                  },
                  {
                    id: 'group',
                    label: t('logPage.groupLabel'),
                    disableSort: false,
                    hide: !columnVisibility.group
                  },
                  {
                    id: 'token_name',
                    label: t('logPage.tokenLabel'),
                    disableSort: false,
                    hide: !columnVisibility.token_name
                  },
                  {
                    id: 'type',
                    label: t('logPage.typeLabel'),
                    disableSort: false,
                    hide: !columnVisibility.type
                  },
                  {
                    id: 'model_name',
                    label: t('logPage.modelLabel'),
                    disableSort: false,
                    hide: !columnVisibility.model_name
                  },
                  {
                    id: 'duration',
                    label: t('logPage.durationLabel'),
                    tooltip: t('logPage.durationTooltip'),
                    disableSort: true,
                    hide: !columnVisibility.duration
                  },
                  {
                    id: 'message',
                    label: t('logPage.inputLabel'),
                    disableSort: true,
                    hide: !columnVisibility.message
                  },
                  {
                    id: 'completion',
                    label: t('logPage.outputLabel'),
                    disableSort: true,
                    hide: !columnVisibility.completion
                  },
                  {
                    id: 'quota',
                    label: t('logPage.quotaLabel'),
                    disableSort: true,
                    hide: !columnVisibility.quota
                  },
                  {
                    id: 'source_ip',
                    label: t('logPage.sourceIp'),
                    disableSort: true,
                    hide: !columnVisibility.source_ip
                  },
                  {
                    id: 'detail',
                    label: t('logPage.detailLabel'),
                    disableSort: true,
                    hide: !columnVisibility.detail,
                    sticky: true
                  }
                ]}
              />
              <TableBody>
                {logs.map((row, index) => (
                  <LogTableRow
                    item={row}
                    key={`${row.id}_${index}`}
                    userIsAdmin={userIsAdmin}
                    userGroup={userGroup}
                    columnVisibility={columnVisibility}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </PerfectScrollbar>
        <TablePagination
          page={page}
          component="div"
          count={listCount}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          onRowsPerPageChange={handleChangeRowsPerPage}
          showFirstButton
          showLastButton
        />
      </Card>
    </>
  )
}

function formatPercentage(value) {
  const numericValue = Number(value || 0) * 100
  return `${numericValue.toFixed(numericValue >= 10 ? 1 : 2)}%`
}

function formatThroughput(value) {
  const numericValue = Number(value || 0)
  if (numericValue >= 100) {
    return Math.round(numericValue).toLocaleString()
  }
  if (numericValue >= 10) {
    return numericValue.toFixed(1).replace(/\.0$/, '')
  }
  return numericValue.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function formatDuration(value) {
  const numericValue = Number(value || 0)
  if (numericValue <= 0) {
    return '0 ms'
  }
  if (numericValue >= 1000) {
    return `${(numericValue / 1000).toFixed(2)} s`
  }
  return `${Math.round(numericValue)} ms`
}
