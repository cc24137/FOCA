
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

  getById = async (req, res) => {
    const professorCRUD = new ProfessorCRUD();
    const { id } = req.body;

    await professorCRUD.getById(id)
      .then((record) => {
        res.status(200).json(record);
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Professor not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }

  update = async (req, res) => {
    const professorCRUD = new ProfessorCRUD();
    const { id, email, name } = req.body;

    await professorCRUD.update(id, email, name)
      .then(() => {
        res.status(200).json({ message: "Professor updated successfully" });
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Professor not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }

  delete = async (req, res) => {
    const professorCRUD = new ProfessorCRUD();
    const { id } = req.body;

    await professorCRUD.delete(id)
      .then(() => {
        res.status(200).json({ message: "Professor deleted successfully" });
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Professor not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }
}

module.exports = ProfessorController;
