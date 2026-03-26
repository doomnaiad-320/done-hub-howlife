package model

import (
	"context"
	"done-hub/common/config"
	"done-hub/common/logger"
	"done-hub/common/utils"
	"fmt"
	"strings"
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Log struct {
	Id               int                                `json:"id"`
	UserId           int                                `json:"user_id" gorm:"index;index:idx_user_created_at"`
	CreatedAt        int64                              `json:"created_at" gorm:"bigint;index:idx_created_at_type;index:idx_user_created_at"`
	Type             int                                `json:"type" gorm:"index:idx_created_at_type"`
	Content          string                             `json:"content"`
	Username         string                             `json:"username" gorm:"index:index_username_model_name,priority:2;default:''"`
	TokenName        string                             `json:"token_name" gorm:"index;default:''"`
	ModelName        string                             `json:"model_name" gorm:"index;index:index_username_model_name,priority:1;default:''"`
	Quota            int                                `json:"quota" gorm:"default:0"`
	PromptTokens     int                                `json:"prompt_tokens" gorm:"default:0"`
	CompletionTokens int                                `json:"completion_tokens" gorm:"default:0"`
	ChannelId        int                                `json:"channel_id" gorm:"index"`
	RequestTime      int                                `json:"request_time" gorm:"default:0"`
	IsStream         bool                               `json:"is_stream" gorm:"default:false"`
	SourceIp         string                             `json:"source_ip" gorm:"default:''"`
	Metadata         datatypes.JSONType[map[string]any] `json:"metadata" gorm:"type:json"`

	Channel *Channel `json:"channel" gorm:"foreignKey:Id;references:ChannelId"`
}

const (
	LogTypeUnknown = iota
	LogTypeTopup
	LogTypeConsume
	LogTypeManage
	LogTypeSystem
)

func RecordQuotaLog(userId int, logType int, quota int, ip string, content string) {
	if logType == LogTypeConsume && !config.LogConsumeEnabled {
		return
	}
	username, _ := CacheGetUsername(userId)
	log := &Log{
		UserId:    userId,
		Username:  username,
		Quota:     quota,
		CreatedAt: utils.GetTimestamp(),
		Type:      logType,
		SourceIp:  ip,
		Content:   content,
	}
	err := DB.Create(log).Error
	if err != nil {
		logger.SysError("failed to record log: " + err.Error())
	}
}

func RecordLog(userId int, logType int, content string) {
	if logType == LogTypeConsume && !config.LogConsumeEnabled {
		return
	}
	username, _ := CacheGetUsername(userId)

	log := &Log{
		UserId:    userId,
		Username:  username,
		CreatedAt: utils.GetTimestamp(),
		Type:      logType,
		Content:   content,
	}
	err := DB.Create(log).Error
	if err != nil {
		logger.SysError("failed to record log: " + err.Error())
	}
}

// RecordLogWithTx 在指定事务中记录日志
func RecordLogWithTx(tx *gorm.DB, userId int, logType int, content string) {
	if logType == LogTypeConsume && !config.LogConsumeEnabled {
		return
	}

	// 在事务中查询用户名，避免事务未提交时查询不到用户
	var username string
	err := tx.Model(&User{}).Where("id = ?", userId).Select("username").Find(&username).Error
	if err != nil {
		logger.SysError("failed to get username in tx: " + err.Error())
		// 如果事务中查询失败，尝试从缓存获取
		username, _ = CacheGetUsername(userId)
	}

	log := &Log{
		UserId:    userId,
		Username:  username,
		CreatedAt: utils.GetTimestamp(),
		Type:      logType,
		Content:   content,
	}
	err = tx.Create(log).Error
	if err != nil {
		logger.SysError("failed to record log with tx: " + err.Error())
	}
}

func RecordConsumeLog(
	ctx context.Context,
	userId int,
	channelId int,
	promptTokens int,
	completionTokens int,
	modelName string,
	tokenName string,
	quota int,
	content string,
	requestTime int,
	isStream bool,
	metadata map[string]any,
	sourceIp string) {
	logger.LogInfo(ctx, fmt.Sprintf("record consume log: userId=%d, channelId=%d, promptTokens=%d, completionTokens=%d, modelName=%s, tokenName=%s, quota=%d, content=%s ,sourceIp=%s", userId, channelId, promptTokens, completionTokens, modelName, tokenName, quota, content, sourceIp))
	if !config.LogConsumeEnabled {
		return
	}

	username, _ := CacheGetUsername(userId)

	log := &Log{
		UserId:           userId,
		Username:         username,
		CreatedAt:        utils.GetTimestamp(),
		Type:             LogTypeConsume,
		Content:          content,
		PromptTokens:     promptTokens,
		CompletionTokens: completionTokens,
		TokenName:        tokenName,
		ModelName:        modelName,
		Quota:            quota,
		ChannelId:        channelId,
		RequestTime:      requestTime,
		IsStream:         isStream,
		SourceIp:         sourceIp,
	}

	if metadata != nil {
		log.Metadata = datatypes.NewJSONType(metadata)
	}

	err := DB.Create(log).Error
	if err != nil {
		logger.LogError(ctx, "failed to record log: "+err.Error())
	}
}

type LogsListParams struct {
	PaginationParams
	LogType        int    `form:"log_type"`
	StartTimestamp int64  `form:"start_timestamp"`
	EndTimestamp   int64  `form:"end_timestamp"`
	ModelName      string `form:"model_name"`
	Username       string `form:"username"`
	TokenName      string `form:"token_name"`
	ChannelId      int    `form:"channel_id"`
	SourceIp       string `form:"source_ip"`
}

type LogsSummary struct {
	Quota            int64   `gorm:"column:quota" json:"quota"`
	RequestCount     int64   `gorm:"column:request_count" json:"request_count"`
	SuccessCount     int64   `gorm:"column:success_count" json:"success_count"`
	FailureCount     int64   `json:"failure_count"`
	FailureRate      float64 `json:"failure_rate"`
	PromptTokens     int64   `gorm:"column:prompt_tokens" json:"prompt_tokens"`
	CompletionTokens int64   `gorm:"column:completion_tokens" json:"completion_tokens"`
	AvgRequestTime   float64 `gorm:"column:avg_request_time" json:"avg_request_time"`
	AvgRPM           float64 `json:"avg_rpm"`
	AvgTPM           float64 `json:"avg_tpm"`
	TimeSpanSeconds  int64   `json:"time_span_seconds"`
	FirstCreatedAt   int64   `gorm:"column:first_created_at" json:"-"`
	LastCreatedAt    int64   `gorm:"column:last_created_at" json:"-"`
}

var allowedLogsOrderFields = map[string]bool{
	"created_at": true,
	"channel_id": true,
	"user_id":    true,
	"token_name": true,
	"model_name": true,
	"type":       true,
	"source_ip":  true,
}

func applyLogsListFilters(tx *gorm.DB, params *LogsListParams, allowUsername bool) *gorm.DB {
	if params.LogType != LogTypeUnknown {
		tx = tx.Where("type = ?", params.LogType)
	}
	if params.ModelName != "" {
		tx = tx.Where("model_name = ?", params.ModelName)
	}
	if allowUsername && params.Username != "" {
		tx = tx.Where("username = ?", params.Username)
	}
	if params.TokenName != "" {
		tx = tx.Where("token_name = ?", params.TokenName)
	}
	if params.StartTimestamp != 0 {
		tx = tx.Where("created_at >= ?", params.StartTimestamp)
	}
	if params.EndTimestamp != 0 {
		tx = tx.Where("created_at <= ?", params.EndTimestamp)
	}
	if params.ChannelId != 0 {
		tx = tx.Where("channel_id = ?", params.ChannelId)
	}
	if params.SourceIp != "" {
		tx = tx.Where("source_ip = ?", params.SourceIp)
	}
	return tx
}

func GetLogsList(params *LogsListParams) (*DataResult[Log], error) {
	var tx *gorm.DB
	var logs []*Log

	tx = DB.Preload("Channel", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, name")
	})
	tx = applyLogsListFilters(tx, params, true)

	return PaginateAndOrder[Log](tx, &params.PaginationParams, &logs, allowedLogsOrderFields)
}

// GetAllLogsList returns all logs matching the criteria without pagination (for export)
func GetAllLogsList(params *LogsListParams) ([]*Log, error) {
	var logs []*Log

	tx := DB.Preload("Channel", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, name")
	})
	tx = applyLogsListFilters(tx, params, true)

	// Apply ordering
	if params.Order != "" {
		orderFields := strings.Split(params.Order, ",")
		for _, field := range orderFields {
			field = strings.TrimSpace(field)
			desc := strings.HasPrefix(field, "-")
			if desc {
				field = field[1:]
			}
			if allowedLogsOrderFields[field] {
				if desc {
					field = field + " DESC"
				}
				tx = tx.Order(field)
			}
		}
	} else {
		// Default ordering
		tx = tx.Order("id DESC")
	}

	err := tx.Find(&logs).Error
	return logs, err
}

func GetUserLogsList(userId int, params *LogsListParams) (*DataResult[Log], error) {
	var logs []*Log

	tx := DB.Where("user_id = ?", userId).Omit("id")
	tx = applyLogsListFilters(tx, params, false)

	result, err := PaginateAndOrder[Log](tx, &params.PaginationParams, &logs, allowedLogsOrderFields)
	if err != nil {
		return nil, err
	}

	for _, log := range *result.Data {
		if log.Type == LogTypeManage || log.Type == LogTypeSystem {
			log.SourceIp = ""
		}
	}

	return result, nil
}

func GetUserRedemptionLogsList(userId int, params *LogsListParams) (*DataResult[Log], error) {
	var logs []*Log

	tx := DB.Where("user_id = ? AND type = ? AND content LIKE ?", userId, LogTypeTopup, "通过兑换码充值%").Omit("id")
	filterParams := *params
	filterParams.LogType = LogTypeUnknown
	tx = applyLogsListFilters(tx, &filterParams, false)

	result, err := PaginateAndOrder[Log](tx, &filterParams.PaginationParams, &logs, allowedLogsOrderFields)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// GetAllUserLogsList returns all user logs matching the criteria without pagination (for export)
func GetAllUserLogsList(userId int, params *LogsListParams) ([]*Log, error) {
	var logs []*Log

	tx := DB.Where("user_id = ?", userId).Omit("id")
	tx = applyLogsListFilters(tx, params, false)

	// Apply ordering
	if params.Order != "" {
		orderFields := strings.Split(params.Order, ",")
		for _, field := range orderFields {
			field = strings.TrimSpace(field)
			desc := strings.HasPrefix(field, "-")
			if desc {
				field = field[1:]
			}
			if allowedLogsOrderFields[field] {
				if desc {
					field = field + " DESC"
				}
				tx = tx.Order(field)
			}
		}
	} else {
		// Default ordering
		tx = tx.Order("id DESC")
	}

	err := tx.Find(&logs).Error
	if err != nil {
		return nil, err
	}

	// Apply the same filtering as in GetUserLogsList
	for _, log := range logs {
		if log.Type == LogTypeManage || log.Type == LogTypeSystem {
			log.SourceIp = ""
		}
	}

	return logs, nil
}

func SearchAllLogs(keyword string) (logs []*Log, err error) {
	err = DB.Where("type = ? or content LIKE ?", keyword, keyword+"%").Order("id desc").Limit(config.MaxRecentItems).Find(&logs).Error
	return logs, err
}

func SearchUserLogs(userId int, keyword string) (logs []*Log, err error) {
	err = DB.Where("user_id = ? and type = ?", userId, keyword).Order("id desc").Limit(config.MaxRecentItems).Omit("id").Find(&logs).Error
	return logs, err
}

func GetLogsSummary(params *LogsListParams) (*LogsSummary, error) {
	return getLogsSummary(DB.Model(&Log{}), params, true)
}

func GetUserLogsSummary(userId int, params *LogsListParams) (*LogsSummary, error) {
	return getLogsSummary(DB.Model(&Log{}).Where("user_id = ?", userId), params, false)
}

func getLogsSummary(tx *gorm.DB, params *LogsListParams, allowUsername bool) (*LogsSummary, error) {
	var summary LogsSummary

	tx = applyLogsListFilters(tx, params, allowUsername)

	selectSQL := fmt.Sprintf(`
		COALESCE(SUM(CASE WHEN type = %d THEN quota ELSE 0 END), 0) AS quota,
		COALESCE(SUM(CASE WHEN type = %d THEN 1 ELSE 0 END), 0) AS request_count,
		COALESCE(SUM(CASE WHEN type = %d AND (request_time > 0 OR prompt_tokens > 0 OR completion_tokens > 0 OR quota > 0) THEN 1 ELSE 0 END), 0) AS success_count,
		COALESCE(SUM(CASE WHEN type = %d THEN prompt_tokens ELSE 0 END), 0) AS prompt_tokens,
		COALESCE(SUM(CASE WHEN type = %d THEN completion_tokens ELSE 0 END), 0) AS completion_tokens,
		COALESCE(AVG(CASE WHEN type = %d AND request_time > 0 THEN request_time END), 0) AS avg_request_time,
		COALESCE(MIN(CASE WHEN type = %d THEN created_at END), 0) AS first_created_at,
		COALESCE(MAX(CASE WHEN type = %d THEN created_at END), 0) AS last_created_at
	`,
		LogTypeConsume,
		LogTypeConsume,
		LogTypeConsume,
		LogTypeConsume,
		LogTypeConsume,
		LogTypeConsume,
		LogTypeConsume,
		LogTypeConsume,
	)

	if err := tx.Select(selectSQL).Scan(&summary).Error; err != nil {
		return nil, err
	}

	summary.FailureCount = summary.RequestCount - summary.SuccessCount
	if summary.FailureCount < 0 {
		summary.FailureCount = 0
	}

	if summary.RequestCount > 0 {
		summary.FailureRate = float64(summary.FailureCount) / float64(summary.RequestCount)
	}

	switch {
	case params.StartTimestamp > 0 && params.EndTimestamp > params.StartTimestamp:
		summary.TimeSpanSeconds = params.EndTimestamp - params.StartTimestamp
	case summary.LastCreatedAt > summary.FirstCreatedAt:
		summary.TimeSpanSeconds = summary.LastCreatedAt - summary.FirstCreatedAt
	case summary.RequestCount > 0:
		summary.TimeSpanSeconds = 60
	}

	if summary.TimeSpanSeconds > 0 {
		minutes := float64(summary.TimeSpanSeconds) / 60
		totalTokens := summary.PromptTokens + summary.CompletionTokens
		summary.AvgRPM = float64(summary.RequestCount) / minutes
		summary.AvgTPM = float64(totalTokens) / minutes
	}

	return &summary, nil
}

func SumUsedQuota(startTimestamp int64, endTimestamp int64, modelName string, username string, tokenName string, channel int) (quota int) {
	tx := DB.Table("logs").Select(assembleSumSelectStr("quota"))
	if username != "" {
		tx = tx.Where("username = ?", username)
	}
	if tokenName != "" {
		tx = tx.Where("token_name = ?", tokenName)
	}
	if startTimestamp != 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp != 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	if modelName != "" {
		tx = tx.Where("model_name = ?", modelName)
	}
	if channel != 0 {
		tx = tx.Where("channel_id = ?", channel)
	}
	tx.Where("type = ?", LogTypeConsume).Scan(&quota)
	return quota
}

func DeleteOldLog(targetTimestamp int64) (int64, error) {
	result := DB.Where("type = ? AND created_at < ?", LogTypeConsume, targetTimestamp).Delete(&Log{})
	return result.RowsAffected, result.Error
}

type LogStatistic struct {
	Date             string `gorm:"column:date"`
	RequestCount     int64  `gorm:"column:request_count"`
	Quota            int64  `gorm:"column:quota"`
	PromptTokens     int64  `gorm:"column:prompt_tokens"`
	CompletionTokens int64  `gorm:"column:completion_tokens"`
	RequestTime      int64  `gorm:"column:request_time"`
}

type LogStatisticGroupModel struct {
	LogStatistic
	ModelName string `gorm:"column:model_name"`
}

type LogStatisticGroupChannel struct {
	LogStatistic
	Channel string `gorm:"column:channel"`
}

type RpmTpmStatistics struct {
	RPM int64   `json:"rpm"`
	TPM int64   `json:"tpm"`
	CPM float64 `json:"cpm"`
}

func GetRpmTpmStatistics() (*RpmTpmStatistics, error) {
	var result struct {
		RPM        int64 `gorm:"column:rpm"`
		TPM        int64 `gorm:"column:tpm"`
		TotalQuota int64 `gorm:"column:total_quota"`
	}

	// 获取最近60秒的统计数据
	now := time.Now().Unix()
	startTime := now - 60

	err := DB.Table("logs").
		Select("COUNT(*) as rpm, COALESCE(SUM(prompt_tokens + completion_tokens), 0) as tpm, COALESCE(SUM(quota), 0) as total_quota").
		Where("type = ? AND created_at >= ?", LogTypeConsume, startTime).
		Scan(&result).Error

	if err != nil {
		return nil, err
	}

	// 计算每分钟消费金额 (美元)
	// total_quota 是系统内部的配额单位，需要转换为美元
	cpm := float64(result.TotalQuota) / float64(config.QuotaPerUnit)

	return &RpmTpmStatistics{
		RPM: result.RPM,
		TPM: result.TPM,
		CPM: cpm,
	}, nil
}
