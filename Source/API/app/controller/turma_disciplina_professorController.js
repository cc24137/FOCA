const TurmaDisciplinaProfessorCRUD = require("../db/turma_disciplina_professorCRUD");

class TurmaDisciplinaProfessorController{

  create = async(req, res) => {
    const turmaDisciplinaProfessorCRUD = new TurmaDisciplinaProfessorCRUD();
    const {idDisciplina, idTurma, idProfessor} = req.body;
    await turmaDisciplinaProfessorCRUD.create(idDisciplina, idTurma, idProfessor)
      .then(()=>{
        res.status(201).json({message: "Relation created."});
      })
      .catch((error)=>{
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      })
  }


  delete = async(req, res) => {
    const turmaDisciplinaProfessorCRUD = new TurmaDisciplinaProfessorCRUD();
    const {id} = req.body;
    await turmaDisciplinaProfessorCRUD.delete(id)
      .then(()=>{
        res.status(200).json({message: "Relation deleted."});
      })
      .catch((error)=>{
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      })
  }
}

module.exports = TurmaDisciplinaProfessorController;