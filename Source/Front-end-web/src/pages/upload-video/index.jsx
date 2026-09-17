import { useLocation, useNavigate } from 'react-router-dom';

export default function UploadVideo() {
  const location = useLocation();
  const navigate = useNavigate();

  // Desestrutura o idAula recebido do state da navegação
  const { idAula } = location.state || {};

  // Opcional: Redireciona de volta se a tela for acessada diretamente sem o ID
  /*
  useEffect(() => {
    if (!idAula) {
      alert('Aula não informada. Voltando para o cadastro...');
      navigate('/cadastro-aula');
    }
  }, [idAula, navigate]);
  */

  return (
    <div>
      <h2>Upload do Vídeo da Aula</h2>
      <p>ID da Aula Atual: <strong>{idAula}</strong></p>
    </div>
  );
}