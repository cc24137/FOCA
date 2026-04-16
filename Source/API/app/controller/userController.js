
const ProfessorCRUD = require('../db/professorCRUD');
const InstituicaoCRUD = require('../db/instituicaoCRUD');
const UserViewModel = require('../viewmodel/userViewmodel');

const {sendMail} = require('../utils/mailer');
const crypto = require('crypto');
const EmailVerificationCRUD = require('../db/emailVerificationCRUD');

// handles methods that are from PROFESSOR and from INSTITUICAO at the same time. Login, for example.

class UserController{  

  
  login = async (req, res)=>{
    console.log("Tried logging in");
    const professorCRUD = new ProfessorCRUD();
    const instituicaoCRUD = new InstituicaoCRUD();
    let found = false;
    let {email, password} = req.body;
    password = password;
    //
    // tries to login as PROFESSOR
    await professorCRUD.professorLogin(email, password)
      .then((recordset) => {
        let finalResult = new UserViewModel(recordset[0], true);
        res.status(200).json(finalResult);
        console.log("Found professor");
        found = true;
      })
      .catch((error)=>{
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
      console.log("Tries to login as INSTITUICAO");
      instituicaoCRUD.instituicaoLogin(email, password)
        .then((recordset) => {
          if (recordset.length > 0){
            let finalResult = new UserViewModel(recordset[0], false);
            res.status(200).json(finalResult);
          }
        })
        .catch((error)=>{
          if (error.name == "Not found"){
            res.status(404).json({message: "No user with such credentials"})
          }
          else if (error.name == "Email not verified"){
            res.status(404).json({message: "Email not verified"});
          }
          else {
            console.log(error);
            res.status(500).json({error: "Internal server error"});
          }
        })
    }
  }


  // -------------------------------------------
  // sign up logic:


  async register(){
    const { email, name } = req.body;
    try {
      
      const code = crypto.randomInt(100000, 999999).toString();

      await emailConfirmationCRUD.deleteCodesByEmail(email);
      await emailConfirmationCRUD.saveCode(email, code);

      const html = `<h1>Olá, ${name}!</h1><p>Seu código é: <b>${code}</b></p>`;
      await sendMail(email, "Código de verificação", html);

      res.status(200).json({ message: "Código enviado!" });
    } catch (error) {
      console.log("Erro", error);
    }
  };

  verify = async (req, res) => {
    const { email, code } = req.body;
    try {
      const professorCRUD = new ProfessorCRUD();
      const instituicaoCRUD = new InstituicaoCRUD();
      const emailVerificationCRUD = new EmailVerificationCRUD();
      // Verificar se o código existe e é válido
      const validRecord = await emailConfirmationCRUD.getValidCode(email, code);

      if (!validRecord) {
        return res.status(400).json({ error: "Código inválido ou expirado." });
      }

      await professorCRUD.verifYEmail(email);
      await instituicaoCRUD.verifYEmail(email);

      await emailVerificationCRUD.deleteCodesByEmail(email);

      res.status(200).json({ message: "E-mail verificado com sucesso!" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

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
    console.log("Cadastro chamado");
    const {email, name, password} = req.body;

    if (req.body.isProfessor){
      // create PROFESSOR
      const professorCRUD = new ProfessorCRUD();
      await professorCRUD.createProfessor(email, password, name)
      .then(async ()=>{
        const code = crypto.randomInt(100000, 999999).toString();
        await emailConfirmationCRUD.deleteCodesByEmail(email);
        await emailConfirmationCRUD.saveCode(email, code);

        const html = `<h1>Olá, ${name}!</h1><p>Seu código é: <b>${code}</b></p>`;
        await sendMail(email, "Código de verificação", html);
        res.status(201).send();
      })
      .catch((error)=>{
        res.status(500).json({error: error});
      })
    }
    // create INSTITUICAO 
    else{
      const instituicaoCRUD = new InstituicaoCRUD();
      await instituicaoCRUD.createInstituicao(email, password, name)
      .then(async ()=>{
        const code = crypto.randomInt(100000, 999999).toString();
        await emailConfirmationCRUD.deleteCodesByEmail(email);
        await emailConfirmationCRUD.saveCode(email, code);

        const html = `<h1>Olá, ${name}!</h1><p>Seu código é: <b>${code}</b></p>`;
        await sendMail(email, "Código de verificação", html);
        res.status(201).send();
      })
      .catch((error)=>{
        res.status(500).json({error: error});
      })
    } 
  }
  

}

module.exports = UserController;
