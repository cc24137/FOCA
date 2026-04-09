const ProfessorCRUD = require('../db/professorCRUD');
const InstituicaoCRUD = require('../db/instituicaoCRUD');

// this viewmodel can be used for both PROFESSOR and INSTITUICAO, as they have the same fields 
class UserViewModel{
  constructor(user, isProfessor){
    // description of atributes to be sent to application
    // only needed in case we need to transfer a diferent type of data then that which is in the database
    this.email = user.email;
    this.nome = user.nome;
    this.id = user.id;
    this.isProfessor = isProfessor; // if not PROFESSOR, then it is INSTITUICAO
  }

  // function to give the data in json format
  jsonReturn(){
    return {
      "id": this.id,
      "nome": this.nome,
      "email": this.email,
      "isProfessor": this.isProfessor
    };
  }
}

module.exports = UserViewModel;

