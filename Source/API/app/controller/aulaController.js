const AulaCRUD = require("../db/aulaCRUD");

class AulaController {
    getByLinkId = async (req, res) => {
        const aulaCRUD = new AulaCRUD();
        const { linkId } = req.params;

        await aulaCRUD
            .getByLinkId(linkId)
            .then((aula) => {
                if (aula) {
                    res.status(200).json(aula);
                } else {
                    res.status(404).json({ message: "Aula not found" });
                }
            })
            .catch((error) => {
                console.log(error);
                res.status(500).json({ error: "Internal server error" });
            });
    };

    create = async (req, res) => {
        const aulaCRUD = new AulaCRUD();
        const { date, content, classSubjectTeacherId } = req.body;

        await aulaCRUD
            .create(date, content, classSubjectTeacherId)
            .then((id) => {
                res.status(201).json({ id });
            })
            .catch((error) => {
                console.log(error);
                res.status(500).json({ error: "Internal server error" });
            });
    };

    delete = async (req, res) => {
        const aulaCRUD = new AulaCRUD();
        const { id } = req.body;

        await aulaCRUD
            .delete(id)
            .then(() => {
                res.status(200).json({ message: "Aula deleted successfully" });
            })
            .catch((error) => {
                if (error.name === "Not found") {
                    res.status(404).json({ message: "Aula not found" });
                } else {
                    console.log(error);
                    res.status(500).json({ error: "Internal server error" });
                }
            });
    };
}

module.exports = AulaController;
