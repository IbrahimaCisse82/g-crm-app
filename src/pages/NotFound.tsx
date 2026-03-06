import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Page introuvable</p>
        <button onClick={() => navigate('/')} className="gradient-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-bold shadow-primary hover:-translate-y-px transition-all">
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default NotFound;
