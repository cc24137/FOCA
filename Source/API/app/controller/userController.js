
const ProfessorCRUD = require('../db/professorCRUD');
const InstituicaoCRUD = require('../db/instituicaoCRUD');
const UserViewModel = require('../viewmodel/userViewmodel');

// handles methods that are from PROFESSOR and from INSTITUICAO at the same time. Login, for example.

class UserController{  

  
  login = async (req, res)=>{
    console.log("Tried logging in");
    const professorCRUD = new ProfessorCRUD();
    const instituicaoCRUD = new InstituicaoCRUD();
    let found = false;
    let {email, password} = req.body;
    // hashing logic TODO
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
          else {
            console.log(error);
            res.status(500).json({error: "Internal server error"});
          }
        })
    }
  }


  /*
  expects such req.body:
  {
	  "isProfessor": bool,
	  "nome": str,
	  "email": str,
	  "senha": str
  }
  */ 
  signUp = async (req, res) =>{
    const {email, nome, senha_hash} = req.body;

    if (req.body.isProfessor){
      // create PROFESSOR
      const professorCRUD = new ProfessorCRUD();
      await professorCRUD.createProfessor(email, senha_hash, nome)
      .then(()=>{
        res.status(201).send();
      })
      .catch((error)=>{
        res.status(500).json({error: error});
      })
    }
    // create INSTITUICAO 
    else{
      const instituicaoCRUD = new InstituicaoCRUD();
      await instituicaoCRUD.createInstituicao(email, senha_hash, nome)
      .then(()=>{
        res.status(201).send();
      })
      .catch((error)=>{
        res.status(500).json({error: error});
      })
    } 
  }
  

}

module.exports = UserController;
