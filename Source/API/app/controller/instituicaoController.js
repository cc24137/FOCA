
const InstituicaoCRUD = require('../db/instituicaoCRUD');

// handles the responses from the CRUD class and apply business logic

class InstituicaoController{

  getById = async (req, res) => {
    const instituicaoCRUD = new InstituicaoCRUD();
    const { id } = req.body;

    await instituicaoCRUD.getById(id)
      .then((record) => {
        res.status(200).json(record);
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Instituicao not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }

  update = async (req, res) => {
    const instituicaoCRUD = new InstituicaoCRUD();
    const { name, password } = req.body;
    const id = req.user.id;

    await instituicaoCRUD.update(id, name, password)
      .then(() => {
        res.status(200).json({ message: "Instituicao updated successfully" });
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Instituicao not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }

  delete = async (req, res) => {
    const instituicaoCRUD = new InstituicaoCRUD();
    const { id } = req.user;

    await instituicaoCRUD.delete(id)
      .then(() => {
        res.status(200).json({ message: "Instituicao deleted successfully" });
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Instituicao not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }

  inviteProfessor = async(req, res) => {
    const instituicaoCRUD = new InstituicaoCRUD();
    const {emailProfessor} = req.body;
    const id = req.user.id;
    console.log("ID: " + id);

    await instituicaoCRUD.inviteProfessor(id, emailProfessor)
      .then(() =>{
        res.status(201).json({message: "Invitation sent."});
      })
      .catch((error) =>{
        if (error.number == 50001){ 
          res.status(404).json({message: "Professor not found"});
        }
        else{
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      })
  }

  removeProfessor = async (req, res) =>{
    const instituicaoCRUD = new InstituicaoCRUD();
    const {id} = req.user;
    const {idProfessor} = req.body;

    await instituicaoCRUD.removeProfessor(idProfessor, id)
      .then(()=>{
        res.status(200).json({message: "Professor removed from institution"});
      })
      .catch((error)=>{
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      })
  }
  
}

module.exports = InstituicaoController;
