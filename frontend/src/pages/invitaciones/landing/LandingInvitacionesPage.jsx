/**
 * LandingInvitacionesPage — Página principal B2C de invitaciones digitales
 */
import InvitacionesPublicLayout from '../InvitacionesPublicLayout';
import HeroSection from './components/HeroSection';
import ComoFuncionaSection from './components/ComoFuncionaSection';
import TiposEventoGrid from './components/TiposEventoGrid';
import PlantillasCarousel from './components/PlantillasCarousel';
import CaracteristicasGrid from './components/CaracteristicasGrid';
import PreciosPreview from './components/PreciosPreview';
import CTARegistro from './components/CTARegistro';
import TestimoniosSection from '../components/TestimoniosSection';

export default function LandingInvitacionesPage() {
  return (
    <InvitacionesPublicLayout>
      <HeroSection />
      <ComoFuncionaSection />
      <TiposEventoGrid />
      <PlantillasCarousel />
      <CaracteristicasGrid />
      <TestimoniosSection />
      <PreciosPreview />
      <CTARegistro />
    </InvitacionesPublicLayout>
  );
}
