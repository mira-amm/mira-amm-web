import BootSequence from "@/shared/ui/Terminal/BootSequence";
import PasswordPrompt from "@/shared/ui/Terminal/PasswordPrompt";

import "@/shared/ui/index.css";

export default function Login() {

  return (
              <>
              <BootSequence />
              {/* <PasswordPrompt onSubmit={handlePasswordSubmit} error={passwordError} /> */}
            </>
  );
}
