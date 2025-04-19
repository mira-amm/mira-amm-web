import { SECRET_NOTES } from '@/lib/constants';

interface SecretNotesProps {
  onReturn: () => void;
}

const SecretNotes = ({ onReturn }: SecretNotesProps) => {
  return (
    <div className="secret-notes">
      <div className="mb-4 border-b border-terminal-red/50 pb-2">
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-terminal-red animate-pulse mr-2"></div>
          <p className="text-terminal-red font-bold text-lg">DEREK DINO'S CONFIDENTIAL PROJECT FILES</p>
        </div>
        <p className="text-terminal-blue text-sm font-bold">TOP SECRET // T-REX EXECUTIVE ACCESS // CLEARANCE LEVEL: CEO</p>
      </div>
      
      <div className="space-y-6">
        {SECRET_NOTES.map((note, index) => (
          <div key={index} className={`note p-3 border-l-4 ${note.isHighlighted ? 'border-terminal-red bg-terminal-red/10 text-terminal-red' : 'border-terminal-blue bg-terminal-blue/5'}`}>
            {note.date && (
              <p className="text-terminal-green font-bold mb-1 flex items-center">
                <span className="mr-2">▲</span>
                <span>MEMO DATE: {note.date}</span>
              </p>
            )}
            <p className="pl-5 font-mono">{note.content}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-6 border-t border-dashed border-terminal-blue pt-4 flex items-center">
        <div className="w-3 h-3 bg-terminal-green animate-ping mr-2"></div>
        <p className="text-terminal-green font-bold">{"> PRESS [ ENTER ] TO RETURN TO DLM-2000 COMMAND PROMPT"}</p>
      </div>
    </div>
  );
};

export default SecretNotes;
