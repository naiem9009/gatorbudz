export const newUserRegistrationEmailTemplate = (name: string, date:Date, email: string) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New User Registration</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #4a6ee0;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 25px;
            border: 1px solid #ddd;
            border-top: none;
        }
        .user-info {
            background: white;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border: 1px solid #e0e0e0;
        }
        .info-item {
            margin: 10px 0;
        }
        .label {
            color: #666;
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }
        .btn {
            display: inline-block;
            background: #4a6ee0;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 5px 0 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .status {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        .pending {
            background: #ffebee;
            color: #c62828;
        }
        .verified {
            background: #e8f5e9;
            color: #2e7d32;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>New User Registered</h1>
    </div>
    
    <div class="content">
        <p><strong>A new user has registered on the platform:</strong></p>
        
        <div class="user-info">
            <div class="info-item">
                <span class="label">Name:</span>
                ${name}
            </div>
            <div class="info-item">
                <span class="label">Email:</span>
                ${email}
            </div>
            <div class="info-item">
                <span class="label">Date:</span>
                ${date}
            </div>
            <div class="info-item">
                <span class="label">Status:</span>
                <span class="status pending">Pending Verification</span>
            </div>
        </div>
    
        
        <div class="footer">
            <p>This is an automated notification. Please do not reply.</p>
            <p>© 2025 Gatorbudz</p>
        </div>
    </div>
</body>
</html>`
}



export default newUserRegistrationEmailTemplate