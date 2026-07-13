interface Type {
    name:string,
    url:string,
}
const verifyEmailTemplate = ({name, url}:Type):string=>{
    return`
    <h2>Dear ${name}!</h2>
    <p>Thank you for registering Health U Shop.</p>
    <p>Please click for verify your email.</p>
    <a href=${url} style="color:white; background:green; padding: 5px 10px; margin-top: 10px; border-radius: 10px; " >
    Verify Email</a>
    `
}

export default verifyEmailTemplate;