
const ProfessorCRUD = require('../db/professorCRUD');
const UserViewModel = require('../viewmodel/userViewmodel');

// handles the responses from the CRUD class and apply business logic

class ProfessorController{
  listAllProfessors = 
    async (req, res) =>{
      const professorCRUD = new ProfessorCRUD();
      professorCRUD.listProfessors()
      .then((recordset) => {
        let finalResult = [];
        for (let i in recordset){
          console.log(recordset[i]);
          let dbo = new UserViewModel(recordset[i], true); // transform data to viewmodel: takes out the password
          finalResult.push(dbo.jsonReturn());
        }
        res.status(200).json(finalResult);
      })
      .catch((error) =>{
        console.log(error);
        res.status(500).json({error: "Internal server error"});
      });
    }
}

module.exports = ProfessorController;
