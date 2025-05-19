import { BootSequence } from '@/shared/ui/Terminal/BootSequence';
import { PasswordPrompt } from '@/shared/ui/Terminal/PasswordPrompt';

export default function Login() {
  return (
    <>
      <BootSequence />
      <PasswordPrompt />
    </>
  );
}
