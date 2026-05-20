const ProfessorCRUD = require('../db/professorCRUD');
const UserViewModel = require('../viewmodel/userViewmodel');

// handles the responses from the CRUD class and apply business logic

class ProfessorController{

  getByInstitution = async (req, res) => {
    const professorCRUD = new ProfessorCRUD();
    const { institutionId } = req.body;

    await professorCRUD.getProfessorByInstitution(institutionId)
      .then((recordset) => {
        res.status(200).json(recordset);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
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
    const { name, password } = req.body;
    const id = req.user.id;
    await professorCRUD.update(id, name, password)
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
    const id = req.user.id;

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

  denyInvitation = async (req, res) => {
    const professorCRUD = new ProfessorCRUD();
    const {instituicaoId} = req.body;
    const {id} = req.user;

    await professorCRUD.denyInvitation(instituicaoId, id)
      .then(()=>{
        res.status(200).json({ message: "Invitation denied" });
      })
      .catch((error) =>{
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      })
  }

  acceptInvitation = async (req, res) => {
    const professorCRUD = new ProfessorCRUD();
    const {instituicaoId} = req.body;
    const {id} = req.user;

    await professorCRUD.accepetInvitation(instituicaoId, id)
      .then(()=>{
        res.status(200).json({ message: "Invitation accepted" });
      })
      .catch((error) =>{
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      })
  }

    getInstitutionLinks = async (req, res) => {

    const professorCRUD = new ProfessorCRUD();
    const {id} = req.user;

    await professorCRUD.getInstitutionLinks(id)
      .then((recordset)=>{
        res.status(200).json(recordset);
      })
      .catch((error) =>{
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      })        
    }

}

module.exports = ProfessorController;
