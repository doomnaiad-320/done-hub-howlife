package model

import (
	"done-hub/common"
	"done-hub/common/utils"
	"errors"
	"strings"

	"gorm.io/gorm"
)

type InvoiceApplicationStatus string

const (
	InvoiceApplicationStatusPending InvoiceApplicationStatus = "pending"
	InvoiceApplicationStatusSent    InvoiceApplicationStatus = "sent"
)

type InvoiceType string

const (
	InvoiceTypeVATGeneral InvoiceType = "vat_general"
	InvoiceTypeVATSpecial InvoiceType = "vat_special"
)

type InvoiceApplication struct {
	ID            int                      `json:"id"`
	UserId        int                      `json:"user_id" gorm:"index"`
	Amount        float64                  `json:"amount" gorm:"type:decimal(10,2);default:0"`
	Currency      CurrencyType             `json:"currency" gorm:"type:varchar(16)"`
	InvoiceType   InvoiceType              `json:"invoice_type" gorm:"type:varchar(32);default:'vat_general'"`
	BankName      string                   `json:"bank_name" gorm:"type:varchar(255)"`
	BankAccount   string                   `json:"bank_account" gorm:"type:varchar(255)"`
	Address       string                   `json:"address" gorm:"type:varchar(255)"`
	Phone         string                   `json:"phone" gorm:"type:varchar(64)"`
	Remark        string                   `json:"remark" gorm:"type:text"`
	ReceiverEmail string                   `json:"receiver_email" gorm:"type:varchar(255)"`
	Status        InvoiceApplicationStatus `json:"status" gorm:"type:varchar(32);default:'pending'"`
	SentAt        int64                    `json:"sent_at" gorm:"bigint;default:0"`
	CreatedAt     int64                    `json:"created_at" gorm:"bigint"`
	UpdatedAt     int64                    `json:"updated_at" gorm:"bigint"`
	DeletedAt     gorm.DeletedAt           `json:"-" gorm:"index"`
	Orders        []Order                  `json:"orders,omitempty" gorm:"foreignKey:InvoiceApplicationID"`
}

var allowedInvoiceApplicationOrderFields = map[string]bool{
	"id":         true,
	"user_id":    true,
	"status":     true,
	"created_at": true,
	"sent_at":    true,
}

type SearchInvoiceApplicationParams struct {
	UserId int    `form:"user_id"`
	Status string `form:"status"`
	PaginationParams
}

func normalizeInvoiceType(invoiceType string) (InvoiceType, error) {
	switch InvoiceType(strings.TrimSpace(invoiceType)) {
	case "", InvoiceTypeVATGeneral:
		return InvoiceTypeVATGeneral, nil
	case InvoiceTypeVATSpecial:
		return InvoiceTypeVATSpecial, nil
	default:
		return "", errors.New("不支持的发票类型")
	}
}

func normalizeInvoiceOrderIDs(orderIDs []int) []int {
	seen := make(map[int]struct{}, len(orderIDs))
	result := make([]int, 0, len(orderIDs))
	for _, orderID := range orderIDs {
		if orderID <= 0 {
			continue
		}
		if _, ok := seen[orderID]; ok {
			continue
		}
		seen[orderID] = struct{}{}
		result = append(result, orderID)
	}
	return result
}

func CreateInvoiceApplication(
	userId int,
	boundEmail string,
	orderIDs []int,
	invoiceType string,
	bankName string,
	bankAccount string,
	address string,
	phone string,
	remark string,
	receiverEmail string,
) (*InvoiceApplication, error) {
	orderIDs = normalizeInvoiceOrderIDs(orderIDs)
	if len(orderIDs) == 0 {
		return nil, errors.New("请选择需要开票的充值记录")
	}

	boundEmail = strings.TrimSpace(boundEmail)
	if boundEmail == "" {
		return nil, errors.New("请先绑定邮箱后再申请开票")
	}

	receiverEmail = strings.TrimSpace(receiverEmail)
	if receiverEmail == "" {
		return nil, errors.New("请填写接收邮箱")
	}
	if !strings.EqualFold(receiverEmail, boundEmail) {
		return nil, errors.New("接收邮箱必须使用当前账号绑定邮箱")
	}
	if err := common.ValidateEmailStrict(receiverEmail); err != nil {
		return nil, errors.New("邮箱格式不符合要求")
	}

	normalizedType, err := normalizeInvoiceType(invoiceType)
	if err != nil {
		return nil, err
	}

	bankName = strings.TrimSpace(bankName)
	bankAccount = strings.TrimSpace(bankAccount)
	address = strings.TrimSpace(address)
	phone = strings.TrimSpace(phone)
	remark = strings.TrimSpace(remark)

	if bankName == "" {
		return nil, errors.New("请填写开户银行")
	}
	if bankAccount == "" {
		return nil, errors.New("请填写银行账号")
	}
	if address == "" {
		return nil, errors.New("请填写地址")
	}
	if phone == "" {
		return nil, errors.New("请填写电话")
	}

	application := &InvoiceApplication{}
	err = DB.Transaction(func(tx *gorm.DB) error {
		var orders []Order
		if err := tx.Where("id IN ? AND user_id = ? AND status = ?", orderIDs, userId, OrderStatusSuccess).Order("created_at ASC").Find(&orders).Error; err != nil {
			return err
		}
		if len(orders) != len(orderIDs) {
			return errors.New("存在不可开票的充值记录")
		}

		currency := orders[0].OrderCurrency
		totalAmount := 0.0
		for _, order := range orders {
			if order.InvoiceApplicationID != 0 || order.InvoiceStatus != "" {
				return errors.New("所选充值记录中存在已申请开票的记录")
			}
			if order.OrderCurrency != currency {
				return errors.New("暂不支持合并不同币种的充值记录开票")
			}
			totalAmount += order.OrderAmount
		}

		application = &InvoiceApplication{
			UserId:        userId,
			Amount:        totalAmount,
			Currency:      currency,
			InvoiceType:   normalizedType,
			BankName:      bankName,
			BankAccount:   bankAccount,
			Address:       address,
			Phone:         phone,
			Remark:        remark,
			ReceiverEmail: receiverEmail,
			Status:        InvoiceApplicationStatusPending,
		}

		if err := tx.Create(application).Error; err != nil {
			return err
		}

		if err := tx.Model(&Order{}).Where("id IN ?", orderIDs).Updates(map[string]any{
			"invoice_application_id": application.ID,
			"invoice_status":         InvoiceApplicationStatusPending,
		}).Error; err != nil {
			return err
		}

		application.Orders = orders
		return nil
	})

	if err != nil {
		return nil, err
	}

	return application, nil
}

func MarkInvoiceApplicationSent(id int) error {
	if id == 0 {
		return errors.New("无效的开票申请 ID")
	}

	return DB.Transaction(func(tx *gorm.DB) error {
		var application InvoiceApplication
		if err := tx.First(&application, id).Error; err != nil {
			return err
		}

		if application.Status == InvoiceApplicationStatusSent {
			return nil
		}

		if err := tx.Model(&application).Updates(map[string]any{
			"status":  InvoiceApplicationStatusSent,
			"sent_at": utils.GetTimestamp(),
		}).Error; err != nil {
			return err
		}

		return tx.Model(&Order{}).Where("invoice_application_id = ?", id).Updates(map[string]any{
			"invoice_status": InvoiceApplicationStatusSent,
		}).Error
	})
}

func GetInvoiceApplicationList(params *SearchInvoiceApplicationParams) (*DataResult[InvoiceApplication], error) {
	var applications []*InvoiceApplication

	db := DB.Model(&InvoiceApplication{}).Preload("Orders", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("created_at ASC")
	})

	if params.UserId != 0 {
		db = db.Where("user_id = ?", params.UserId)
	}
	if params.Status != "" {
		db = db.Where("status = ?", params.Status)
	}

	return PaginateAndOrder(db, &params.PaginationParams, &applications, allowedInvoiceApplicationOrderFields)
}

func GetUserInvoiceApplicationList(userId int, params *SearchInvoiceApplicationParams) (*DataResult[InvoiceApplication], error) {
	params.UserId = userId
	return GetInvoiceApplicationList(params)
}
