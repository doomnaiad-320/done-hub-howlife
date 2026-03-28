package controller

import (
	"done-hub/common"
	"done-hub/model"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateInvoiceApplicationRequest struct {
	OrderIDs      []int  `json:"order_ids"`
	InvoiceType   string `json:"invoice_type"`
	BankName      string `json:"bank_name"`
	BankAccount   string `json:"bank_account"`
	Address       string `json:"address"`
	Phone         string `json:"phone"`
	Remark        string `json:"remark"`
	ReceiverEmail string `json:"receiver_email"`
}

func CreateUserInvoiceApplication(c *gin.Context) {
	userID := c.GetInt("id")
	user, err := model.GetUserById(userID, false)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	var req CreateInvoiceApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	application, err := model.CreateInvoiceApplication(
		userID,
		user.Email,
		req.OrderIDs,
		req.InvoiceType,
		req.BankName,
		req.BankAccount,
		req.Address,
		req.Phone,
		req.Remark,
		req.ReceiverEmail,
	)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    application,
	})
}

func GetUserInvoiceApplicationList(c *gin.Context) {
	userID := c.GetInt("id")

	var params model.SearchInvoiceApplicationParams
	if err := c.ShouldBindQuery(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	applications, err := model.GetUserInvoiceApplicationList(userID, &params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    applications,
	})
}

func GetInvoiceApplicationList(c *gin.Context) {
	var params model.SearchInvoiceApplicationParams
	if err := c.ShouldBindQuery(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	applications, err := model.GetInvoiceApplicationList(&params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    applications,
	})
}

func MarkInvoiceApplicationSent(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	if err := model.MarkInvoiceApplicationSent(id); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}
