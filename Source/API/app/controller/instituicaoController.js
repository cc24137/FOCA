
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
    const { id, name, password } = req.body;

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
    const { id } = req.body;

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
}

module.exports = InstituicaoController;
