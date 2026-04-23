const DisciplinaCRUD = require('../db/disciplinaCRUD');

class DisciplinaController {

  getByInstitution = async (req, res) => {
    const disciplinaCRUD = new DisciplinaCRUD();
    const { institutionId } = req.body;

    await disciplinaCRUD.getDisciplinasByInstitution(institutionId)
      .then((recordset) => {
        res.status(200).json(recordset);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      });
  }

  getById = async (req, res) => {
    const disciplinaCRUD = new DisciplinaCRUD();
    const { id } = req.body;

    await disciplinaCRUD.getDisciplinaById(id)
      .then((record) => {
        res.status(200).json(record);
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Disciplina not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }

  create = async (req, res) => {
    const disciplinaCRUD = new DisciplinaCRUD();
    const { name, institutionId } = req.body;

    await disciplinaCRUD.createDisciplina(name, institutionId)
      .then((insertedId) => {
        res.status(201).json({ id: insertedId });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      });
  }

  update = async (req, res) => {
    const disciplinaCRUD = new DisciplinaCRUD();
    const { id, name } = req.body;

    await disciplinaCRUD.updateDisciplina(id, name)
      .then(() => {
        res.status(200).json({ message: "Disciplina updated successfully" });
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Disciplina not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }

  delete = async (req, res) => {
    const disciplinaCRUD = new DisciplinaCRUD();
    const { id } = req.body;

    await disciplinaCRUD.deleteDisciplina(id)
      .then(() => {
        res.status(200).json({ message: "Disciplina deleted successfully" });
      })
      .catch((error) => {
        if (error.name === "Not found") {
          res.status(404).json({ message: "Disciplina not found" });
        } else {
          console.log(error);
          res.status(500).json({ error: "Internal server error" });
        }
      });
  }
}

module.exports = DisciplinaController;