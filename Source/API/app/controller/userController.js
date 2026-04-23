
const ProfessorCRUD = require('../db/professorCRUD');
const InstituicaoCRUD = require('../db/instituicaoCRUD');
const UserViewModel = require('../viewmodel/userViewmodel');

const {sendMail} = require('../utils/mailer');
const crypto = require('crypto');
const EmailVerificationCRUD = require('../db/emailVerificationCRUD');

// handles methods that are from PROFESSOR and from INSTITUICAO at the same time. Login, for example.

class UserController{  

  login = async (req, res)=>{
    const professorCRUD = new ProfessorCRUD();
    const instituicaoCRUD = new InstituicaoCRUD();
    let found = false;
    let {email, password} = req.body;
    password = password;
    
    // tries to login as PROFESSOR
    await professorCRUD.professorLogin(email, password)
      .then((recordset) => {
        let finalResult = new UserViewModel(recordset[0], true);
        res.status(200).json(finalResult);
        found = true;
      })
      .catch(error=>{
        if (error.name != "Not found"){
          if (error.name == "Incorrect password"){
            res.status(404).json({message: "Incorrect password"});
            found = true;
          }
          else if (error.name == "Email not verified"){
            res.status(404).json({message: "Email not verified"});
            found = true;
          }
          else{
            console.log(error);
            res.status(500).json({error: "Internal server error"});
            found = true;
          }
        }
      });

    // tries to login as INSTITUICAO
    if (!found) {
      instituicaoCRUD.instituicaoLogin(email, password)
        .then((recordset) => {
          if (recordset.length > 0){
            let finalResult = new UserViewModel(recordset[0], false);
            res.status(200).json(finalResult);
          }
        })
        .catch((error)=>{
          console.log(error.name);
          if (error.name != "Not found"){
            if (error.name == "Incorrect password"){
              res.status(404).json({message: "Incorrect password"});
              found = true;
            }
            else if (error.name == "Email not verified"){
              res.status(404).json({message: "Email not verified"});
              found = true;
            }
            else{
              console.log(error);
              res.status(500).json({error: "Internal server error"});
              found = true;
            }
          }
          else{
            res.status(404).json({message: "User not found"});
          }
        })
    }
  }

  // -------------------------------------------
  // sign up logic:


  verify = async (req, res) => {
    console.log("Tentativa de verificação de email");
    const { email, code } = req.body;
    try {
      const professorCRUD = new ProfessorCRUD();
      const instituicaoCRUD = new InstituicaoCRUD();
      const emailVerificationCRUD = new EmailVerificationCRUD();
      // Verificar se o código existe e é válido
      const validRecord = await emailVerificationCRUD.getValidCode(email, code);

      if (!validRecord) {
        return res.status(400).json({ error: "Invalid or expired code." });
      }
      try{
        await professorCRUD.verifYEmail(email);
      }
      catch{}
      await instituicaoCRUD.verifYEmail(email);

      await emailVerificationCRUD.deleteCodesByEmail(email);

      res.status(200).json({ message: "E-mail verified successfuly." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  sendCode = async (req, res) =>{
    try{
      console.log("Enviar código chamado");
      const {email} = req.body;
      const emailVerificationCRUD = new EmailVerificationCRUD();

      const code = crypto.randomInt(100000, 999999).toString();
      await emailVerificationCRUD.deleteCodesByEmail(email);
      await emailVerificationCRUD.saveCode(email, code);

      const html = `<h1>Olá!</h1><p>Seu código é: <b>${code}</b></p><br><p>Ele expira em 15 minutos.</p>`;
      await sendMail(email, "Código de verificação", html);

      res.status(201).send();
    }
    catch(error){
      console.log(error);
      res.status(500).json({error: error});
    }
  }

  /*
  expects such req.body:
  {
	  "isProfessor": bool,
	  "name": str,
	  "email": str,
	  "password": str
  }
  */ 
  signUp = async (req, res) =>{
    console.log("Sign Up chamado!");
    const {email, name, password} = req.body;

    if (req.body.isProfessor){
      // create PROFESSOR
      const professorCRUD = new ProfessorCRUD();
      const emailVerificationCRUD = new EmailVerificationCRUD();
      await professorCRUD.createProfessor(email, password, name)
      .then(async ()=>{
        const code = crypto.randomInt(100000, 999999).toString();
        await emailVerificationCRUD.deleteCodesByEmail(email);
        await emailVerificationCRUD.saveCode(email, code);

        const html = `<h1>Olá, ${name}!</h1><p>Seu código é: <b>${code}</b></p><br><p>Ele expira em 15 minutos.</p>`;
        await sendMail(email, "Código de verificação", html);
        console.log("Professor criado. Código de verificação mandado!");
        res.status(201).send();
      })
      .catch(error=>{
        console.log(error);
        console.log("Deu erro ao cadastrar professor.");
        res.status(500).json({error: error});
      })
    }
    // create INSTITUICAO 
    else{
      const instituicaoCRUD = new InstituicaoCRUD();
      const emailVerificationCRUD = new EmailVerificationCRUD();
      await instituicaoCRUD.createInstituicao(email, password, name)
      .then(async ()=>{
        const code = crypto.randomInt(100000, 999999).toString();
        await emailVerificationCRUD.deleteCodesByEmail(email);
        await emailVerificationCRUD.saveCode(email, code);

        const html = `<h1>Olá, ${name}!</h1><p>Seu código é: <b>${code}</b></p>`;
        await sendMail(email, "Código de verificação", html);
        console.log("Professor criado. Código de verificação mandado!");
        res.status(201).send();
      })
      .catch(error=>{
        console.log("Deu erro ao cadastrar professor.");
        res.status(500).json({error: error});
      })
    } 
  }

  // change password
  // the app flow should be:
  // call sendCode() and then call changePassword()
  changePassword = async (req, res) =>{
    console.log("Chamada de mudar a senha.");
    const { email, code, password } = req.body;
    try {
      const professorCRUD = new ProfessorCRUD();
      const instituicaoCRUD = new InstituicaoCRUD();
      const emailVerificationCRUD = new EmailVerificationCRUD();
      // Verificar se o código existe e é válido
      const validRecord = await emailVerificationCRUD.getValidCode(email, code);

      if (!validRecord) {
        return res.status(400).json({ error: "Invalid or expired code." });
      }
      try{
        await professorCRUD.changePassword(email, password);
      }
      catch{}
      await instituicaoCRUD.changePassword  (email, password);

      await emailVerificationCRUD.deleteCodesByEmail(email);

      res.status(200).json({ message: "Password changed." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

}

module.exports = UserController;
