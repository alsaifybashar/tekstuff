// services/email_service.go - Email notifications and templates
package services

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"strconv"

	"ecommerce-backend/config"
	"ecommerce-backend/models"
)

type EmailService struct {
	config config.SMTPConfig
}

func NewEmailService(config config.SMTPConfig) *EmailService {
	return &EmailService{config: config}
}

// SendOrderConfirmation sends order confirmation email
func (s *EmailService) SendOrderConfirmation(order *models.Order) error {
	if order == nil {
		return fmt.Errorf("order is nil")
	}

	subject := fmt.Sprintf("Orderbekräftelse - %s", order.OrderNumber)

	templateData := struct {
		Order *models.Order
		Items []models.OrderItem
	}{
		Order: order,
		Items: order.Items,
	}

	body, err := s.renderTemplate("order_confirmation", templateData)
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	return s.sendEmail(order.CustomerEmail, subject, body)
}

// SendOrderStatusUpdate sends order status change notification
func (s *EmailService) SendOrderStatusUpdate(order *models.Order, oldStatus, newStatus string) error {
	if order == nil {
		return fmt.Errorf("order is nil")
	}

	subject := fmt.Sprintf("Orderuppdatering - %s", order.OrderNumber)

	templateData := struct {
		Order     *models.Order
		OldStatus string
		NewStatus string
	}{
		Order:     order,
		OldStatus: oldStatus,
		NewStatus: newStatus,
	}

	body, err := s.renderTemplate("order_status_update", templateData)
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	return s.sendEmail(order.CustomerEmail, subject, body)
}

// SendShippingNotification sends shipping confirmation with tracking
func (s *EmailService) SendShippingNotification(order *models.Order) error {
	if order == nil {
		return fmt.Errorf("order is nil")
	}

	subject := fmt.Sprintf("Din beställning har skickats - %s", order.OrderNumber)

	templateData := struct {
		Order *models.Order
	}{
		Order: order,
	}

	body, err := s.renderTemplate("shipping_notification", templateData)
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	return s.sendEmail(order.CustomerEmail, subject, body)
}

// SendWelcomeEmail sends welcome email to new users
func (s *EmailService) SendWelcomeEmail(user *models.User) error {
	if user == nil {
		return fmt.Errorf("user is nil")
	}

	subject := "Välkommen till vår webshop!"

	templateData := struct {
		User *models.User
	}{
		User: user,
	}

	body, err := s.renderTemplate("welcome", templateData)
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	return s.sendEmail(user.Email, subject, body)
}

// SendPasswordResetEmail sends password reset email
func (s *EmailService) SendPasswordResetEmail(email, resetToken string) error {
	subject := "Återställ ditt lösenord"

	templateData := struct {
		Email      string
		ResetToken string
		ResetLink  string
	}{
		Email:      email,
		ResetToken: resetToken,
		ResetLink:  fmt.Sprintf("https://yourwebshop.com/reset-password?token=%s", resetToken),
	}

	body, err := s.renderTemplate("password_reset", templateData)
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	return s.sendEmail(email, subject, body)
}

// SendLowStockAlert sends low stock alert to admin
func (s *EmailService) SendLowStockAlert(products []InventoryAlert) error {
	if len(products) == 0 {
		return nil
	}

	subject := "Lågt lager - Åtgärd krävs"

	templateData := struct {
		Products []InventoryAlert
		Count    int
	}{
		Products: products,
		Count:    len(products),
	}

	body, err := s.renderTemplate("low_stock_alert", templateData)
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	// Send to admin email
	adminEmail := "admin@yourwebshop.com" // Configure this in environment
	return s.sendEmail(adminEmail, subject, body)
}

// sendEmail sends email using SMTP
func (s *EmailService) sendEmail(to, subject, body string) error {
	if s.config.Host == "" || s.config.Username == "" {
		// Email not configured, just log instead of failing
		fmt.Printf("Email would be sent to %s: %s\n", to, subject)
		return nil
	}

	auth := smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host)

	msg := []byte(fmt.Sprintf(
		"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=UTF-8\r\n"+
			"\r\n"+
			"%s",
		to, subject, body,
	))

	addr := s.config.Host + ":" + strconv.Itoa(s.config.Port)
	return smtp.SendMail(addr, auth, s.config.From, []string{to}, msg)
}

// renderTemplate renders email template with data
func (s *EmailService) renderTemplate(templateName string, data interface{}) (string, error) {
	templates := map[string]string{
		"order_confirmation":    orderConfirmationTemplate,
		"order_status_update":   orderStatusUpdateTemplate,
		"shipping_notification": shippingNotificationTemplate,
		"welcome":               welcomeTemplate,
		"password_reset":        passwordResetTemplate,
		"low_stock_alert":       lowStockAlertTemplate,
	}

	templateStr, exists := templates[templateName]
	if !exists {
		return "", fmt.Errorf("template %s not found", templateName)
	}

	tmpl, err := template.New(templateName).Parse(templateStr)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

// Email templates
const orderConfirmationTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Orderbekräftelse</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .item { border-bottom: 1px solid #eee; padding: 10px 0; }
        .total { font-weight: bold; font-size: 1.2em; color: #007bff; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Tack för din beställning!</h1>
        </div>
        <div class="content">
            <h2>Orderbekräftelse - {{.Order.OrderNumber}}</h2>
            
            <div class="order-details">
                <p><strong>Ordernummer:</strong> {{.Order.OrderNumber}}</p>
                <p><strong>Datum:</strong> {{.Order.CreatedAt.Format "2006-01-02 15:04"}}</p>
                <p><strong>Status:</strong> {{.Order.Status}}</p>
            </div>

            <div class="order-details">
                <h3>Beställda produkter:</h3>
                {{range .Items}}
                <div class="item">
                    <strong>{{.Name}}</strong><br>
                    SKU: {{.SKU}}<br>
                    Antal: {{.Quantity}} st<br>
                    Pris: {{printf "%.2f" .Price}} SEK<br>
                    Totalt: {{printf "%.2f" .Total}} SEK
                </div>
                {{end}}
                
                <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #007bff;">
                    <p><strong>Delsumma:</strong> {{printf "%.2f" .Order.Subtotal}} SEK</p>
                    <p><strong>Moms (25%):</strong> {{printf "%.2f" .Order.TaxAmount}} SEK</p>
                    <p><strong>Frakt:</strong> {{printf "%.2f" .Order.ShippingAmount}} SEK</p>
                    <p class="total">Totalt: {{printf "%.2f" .Order.TotalAmount}} SEK</p>
                </div>
            </div>

            {{if .Order.ShippingAddress}}
            <div class="order-details">
                <h3>Leveransadress:</h3>
                <p>
                    {{.Order.ShippingAddress.FirstName}} {{.Order.ShippingAddress.LastName}}<br>
                    {{if .Order.ShippingAddress.Company}}{{.Order.ShippingAddress.Company}}<br>{{end}}
                    {{.Order.ShippingAddress.AddressLine1}}<br>
                    {{if .Order.ShippingAddress.AddressLine2}}{{.Order.ShippingAddress.AddressLine2}}<br>{{end}}
                    {{.Order.ShippingAddress.PostalCode}} {{.Order.ShippingAddress.City}}<br>
                    {{.Order.ShippingAddress.Country}}
                </p>
            </div>
            {{end}}

            <p>Vi kommer att skicka en bekräftelse när din order har behandlats och skickats.</p>
        </div>
        <div class="footer">
            <p>Tack för att du handlar hos oss!</p>
        </div>
    </div>
</body>
</html>
`

const orderStatusUpdateTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Orderuppdatering</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .status-update { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; text-align: center; }
        .new-status { font-size: 1.5em; font-weight: bold; color: #28a745; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Orderuppdatering</h1>
        </div>
        <div class="content">
            <h2>Din order {{.Order.OrderNumber}} har uppdaterats</h2>
            
            <div class="status-update">
                <p>Status har ändrats från <strong>{{.OldStatus}}</strong> till:</p>
                <p class="new-status">{{.NewStatus}}</p>
            </div>

            {{if .Order.TrackingNumber}}
            <div style="background: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h3>Spårningsinformation:</h3>
                <p><strong>Spårningsnummer:</strong> {{.Order.TrackingNumber}}</p>
            </div>
            {{end}}

            <p><strong>Totalbelopp:</strong> {{printf "%.2f" .Order.TotalAmount}} SEK</p>
        </div>
        <div class="footer">
            <p>Har du frågor? Kontakta vår kundservice.</p>
        </div>
    </div>
</body>
</html>
`

const shippingNotificationTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Din order har skickats</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .tracking { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; text-align: center; }
        .tracking-number { font-size: 1.3em; font-weight: bold; color: #007bff; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Din order är på väg! 📦</h1>
        </div>
        <div class="content">
            <h2>Order {{.Order.OrderNumber}} har skickats</h2>
            
            <p>Bra nyheter! Din beställning har skickats och är nu på väg till dig.</p>

            {{if .Order.TrackingNumber}}
            <div class="tracking">
                <h3>Spåra ditt paket:</h3>
                <p class="tracking-number">{{.Order.TrackingNumber}}</p>
                <p>Använd detta spårningsnummer för att följa ditt pakets resa.</p>
            </div>
            {{end}}

            {{if .Order.ShippingAddress}}
            <div style="background: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h3>Leveransadress:</h3>
                <p>
                    {{.Order.ShippingAddress.FirstName}} {{.Order.ShippingAddress.LastName}}<br>
                    {{.Order.ShippingAddress.AddressLine1}}<br>
                    {{.Order.ShippingAddress.PostalCode}} {{.Order.ShippingAddress.City}}
                </p>
            </div>
            {{end}}

            <p>Uppskattat leveransdatum: 2-5 arbetsdagar</p>
        </div>
        <div class="footer">
            <p>Tack för ditt köp!</p>
        </div>
    </div>
</body>
</html>
`

const welcomeTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Välkommen</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .welcome-box { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; text-align: center; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Välkommen till vår webshop! 🎉</h1>
        </div>
        <div class="content">
            <div class="welcome-box">
                <h2>Hej {{.User.FirstName}}!</h2>
                <p>Tack för att du registrerat dig hos oss. Vi är glada att välkomna dig som kund!</p>
            </div>

            <div style="background: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h3>Dina kontouppgifter:</h3>
                <p><strong>E-post:</strong> {{.User.Email}}</p>
                <p><strong>Namn:</strong> {{.User.FirstName}} {{.User.LastName}}</p>
            </div>

            <div style="background: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h3>Vad kan du göra nu?</h3>
                <ul>
                    <li>Utforska vårt sortiment av kvalitetsprodukter</li>
                    <li>Lägg till produkter i din önskelista</li>
                    <li>Spara dina leveransadresser för snabbare checkout</li>
                    <li>Få exklusiva erbjudanden och nyheter</li>
                </ul>
            </div>

            <p style="text-align: center;">
                <a href="https://yourwebshop.com" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Börja handla nu</a>
            </p>
        </div>
        <div class="footer">
            <p>Har du frågor? Kontakta oss gärna!</p>
        </div>
    </div>
</body>
</html>
`

const passwordResetTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Återställ lösenord</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .reset-box { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; text-align: center; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Återställ ditt lösenord</h1>
        </div>
        <div class="content">
            <div class="reset-box">
                <h2>Lösenordsåterställning begärd</h2>
                <p>Vi mottog en begäran om att återställa lösenordet för: {{.Email}}</p>
            </div>

            <div style="background: white; padding: 15px; margin: 15px 0; border-radius: 5px; text-align: center;">
                <p>Klicka på knappen nedan för att återställa ditt lösenord:</p>
                <a href="{{.ResetLink}}" style="background: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Återställ lösenord</a>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p><strong>Säkerhetsnotis:</strong></p>
                <ul>
                    <li>Länken är giltig i 1 timme</li>
                    <li>Om du inte begärde denna återställning, ignorera detta e-postmeddelande</li>
                    <li>Dela aldrig denna länk med andra</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>Om knappen inte fungerar, kopiera och klistra in denna länk: {{.ResetLink}}</p>
        </div>
    </div>
</body>
</html>
`

const lowStockAlertTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Lågt lager - Varning</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #212529; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .alert-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
        .product-list { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .product-item { border-bottom: 1px solid #eee; padding: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Lagervarning</h1>
        </div>
        <div class="content">
            <div class="alert-box">
                <h2>Lågt lager upptäckt</h2>
                <p><strong>{{.Count}} produkter</strong> har nått kritiska lagernivåer och behöver påfyllning.</p>
            </div>

            <div class="product-list">
                <h3>Produkter som behöver åtgärd:</h3>
                {{range .Products}}
                <div class="product-item">
                    <strong>{{.ProductName}}</strong> ({{.SKU}})<br>
                    Nuvarande lager: <strong style="color: #dc3545;">{{.CurrentStock}} st</strong><br>
                    Minimum lager: {{.MinStock}} st<br>
                    Status: {{if eq .CurrentStock 0}}<span style="color: #dc3545;">Slut i lager</span>{{else}}<span style="color: #ffc107;">Lågt lager</span>{{end}}
                </div>
                {{end}}
            </div>

            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 15px 0; border-radius: 5px; color: #721c24;">
                <p><strong>Åtgärd krävs:</strong> Vänligen påfylla lagret för dessa produkter så snart som möjligt för att undvika förlorade försäljningar.</p>
            </div>
        </div>
        <div class="footer">
            <p>Detta är en automatisk varning från lagersystemet.</p>
        </div>
    </div>
</body>
</html>
`
