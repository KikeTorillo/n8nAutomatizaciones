/**
 * InvitacionesPublicLayout — Wrapper B2C con tema rosa
 * Header + contenido + Footer. Sin sidebar empresarial.
 */
import InvitacionesHeader from './components/InvitacionesHeader';
import InvitacionesFooter from './components/InvitacionesFooter';

export default function InvitacionesPublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <InvitacionesHeader />
      <main className="flex-1">
        {children}
      </main>
      <InvitacionesFooter />
    </div>
  );
}
