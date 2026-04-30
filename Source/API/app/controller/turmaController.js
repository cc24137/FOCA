const TurmaCRUD = require('../db/turmaCRUD');

class TurmaController {

  getByInstitution = async (req, res) => {
    const turmaCRUD = new TurmaCRUD();
    const { institutionId } = req.body;

    await turmaCRUD.getTurmasByInstituicao(institutionId)
      .then((recordset) => {
        res.status(200).json(recordset);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      });
  }

  getById = async (req, res) => {
    const turmaCRUD = new TurmaCRUD();
    const { id } = req.body;

    await turmaCRUD.getTurmaById(id)
      .then((record) => {
        res.status(200).json(record);
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Turma not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }

  create = async (req, res) => {
    const turmaCRUD = new TurmaCRUD();
    const { name, institutionId, studentCount, grade } = req.body;

    await turmaCRUD.createTurma(name, institutionId, studentCount, grade)
      .then((insertedId) => {
        res.status(201).json({ id: insertedId });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      });
  }

  update = async (req, res) => {
    const turmaCRUD = new TurmaCRUD();
    const { id, name, studentCount, grade } = req.body;

    await turmaCRUD.updateTurma(id, name, studentCount, grade)
      .then(() => {
        res.status(200).json({ message: "Turma updated successfully" });
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Turma not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }

  delete = async (req, res) => {
    const turmaCRUD = new TurmaCRUD();
    const { id } = req.body;

    await turmaCRUD.deleteTurma(id)
      .then(() => {
        res.status(200).json({ message: "Turma deleted successfully" });
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Turma not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }
}

module.exports = TurmaController;