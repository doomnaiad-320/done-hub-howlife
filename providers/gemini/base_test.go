package gemini

import (
	"done-hub/common/config"
	"done-hub/common/test"
	_ "done-hub/common/test/init"
	"done-hub/model"
	"testing"

	"gorm.io/datatypes"

	"github.com/stretchr/testify/assert"
)

func TestGetConfigUsesGeminiOpenAICompatPath(t *testing.T) {
	cfg := getConfig("v1beta")

	assert.Equal(t, "/v1beta/openai/chat/completions", cfg.ChatCompletions)
}

func TestGeminiNativeRequestURLUsesModelsEndpoint(t *testing.T) {
	baseURL := "https://generativelanguage.googleapis.com"
	channel := model.Channel{
		Type:    config.ChannelTypeGemini,
		BaseURL: &baseURL,
		Other:   "v1beta",
		Key:     test.GetTestToken(),
	}
	context, _ := test.GetContext("POST", "/v1/chat/completions", test.RequestJSONConfig(), nil)

	provider := GeminiProviderFactory{}.Create(&channel)
	provider.SetContext(context)
	geminiProvider := provider.(*GeminiProvider)

	assert.Equal(
		t,
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
		geminiProvider.GetFullRequestURL("generateContent", "gemini-2.0-flash"),
	)
}

func TestGeminiOpenAICompatRequestUsesOpenAIPath(t *testing.T) {
	baseURL := "https://generativelanguage.googleapis.com"
	plugin := datatypes.NewJSONType(model.PluginType{
		"use_openai_api": {
			"enable": true,
		},
	})
	channel := model.Channel{
		Type:    config.ChannelTypeGemini,
		BaseURL: &baseURL,
		Other:   "v1beta",
		Key:     test.GetTestToken(),
		Plugin:  &plugin,
	}
	context, _ := test.GetContext("POST", "/v1/chat/completions", test.RequestJSONConfig(), nil)

	provider := GeminiProviderFactory{}.Create(&channel)
	provider.SetContext(context)
	geminiProvider := provider.(*GeminiProvider)

	assert.True(t, geminiProvider.UseOpenaiAPI)
	assert.Equal(
		t,
		"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
		geminiProvider.OpenAIProvider.GetFullRequestURL(geminiProvider.Config.ChatCompletions, "gemini-2.0-flash"),
	)
}
