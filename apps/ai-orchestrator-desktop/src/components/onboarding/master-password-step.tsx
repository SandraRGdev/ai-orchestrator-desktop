import { useState, FormEvent } from 'react';

interface MasterPasswordStepProps {
  onNext: (password: string) => void;
  onBack: () => void;
}

export function MasterPasswordStep({ onNext, onBack }: MasterPasswordStepProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    onNext(password);
  };

  const getPasswordStrength = (pwd: string): { strength: string; color: string } => {
    if (pwd.length === 0) return { strength: '', color: '' };
    if (pwd.length < 8) return { strength: 'Débil', color: 'text-red-500' };
    if (pwd.length < 12) return { strength: 'Media', color: 'text-yellow-500' };
    return { strength: 'Fuerte', color: 'text-green-500' };
  };

  const strength = getPasswordStrength(password);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Crear Contraseña Maestra
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Esta contraseña cifra tus claves de API. No la pierdas — no se puede recuperar.
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-2xl mr-3">⚠️</span>
          <div className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Importante:</strong> Asegúrate de recordar tu contraseña maestra. No hay mecanismo de recuperación de contraseña.
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Contraseña Maestra
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Al menos 8 caracteres"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          required
          autoFocus
        />
        {password && (
          <div className="mt-2 text-sm">
            Fortaleza de la contraseña: <span className={`font-medium ${strength.color}`}>{strength.strength}</span>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirmar Contraseña
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Vuelve a ingresar la contraseña"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-xl mr-2">❌</span>
            <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Atrás
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Continuar
        </button>
      </div>
    </form>
  );
}
