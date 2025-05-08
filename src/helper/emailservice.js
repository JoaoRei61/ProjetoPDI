import SibApiV3Sdk from 'sib-api-v3-sdk';

// Configuração da API Key do Brevo
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = " 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"; 

// Função para enviar email de credenciais para docentes
export const enviarEmailCredenciais = async (email, senha) => {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = "Credenciais da sua conta de docente";
    sendSmtpEmail.htmlContent = `
        <p><strong>Bem-vindo!</strong></p>
        <p>Aqui estão as suas credenciais de acesso:</p>
        <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Senha:</strong> ${senha}</li>
        </ul>
        <p>Recomenda-se alterar a senha após o primeiro login.</p>
    `;
    sendSmtpEmail.sender = { name: "ISCAcademy", email: "grupopdi3@gmail.com" }; 
    sendSmtpEmail.to = [{ email: email, name: "Docente" }];

    try {
        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("Email de credenciais enviado com sucesso para:", email);
    } catch (error) {
        console.error("Erro ao enviar email:", error.response ? error.response.body : error.message);
    }
};

export default enviarEmailCredenciais;
