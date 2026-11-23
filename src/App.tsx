import { RouterProvider, useRouter } from './router';
import { Header, Footer, MobileBar } from './components/Chrome';
import Home from './pages/Home';
import { About, Booking, Contact, GalleryPage, Policies, Restaurant, RoomDetail, Rooms, Wellness } from './pages/Inner';

function View() {
  const { route } = useRouter();
  switch (route) {
    case 'rooms': return <Rooms />;
    case 'room-executive-hill-view': return <RoomDetail slug="executive-hill-view" />;
    case 'room-executive-river-view': return <RoomDetail slug="executive-river-view" />;
    case 'room-family-suite': return <RoomDetail slug="family-suite" />;
    case 'about': return <About />;
    case 'restaurant': return <Restaurant />;
    case 'wellness': return <Wellness />;
    case 'gallery': return <GalleryPage />;
    case 'contact': return <Contact />;
    case 'booking': return <Booking />;
    case 'policies': return <Policies />;
    default: return <Home />;
  }
}

function Shell() {
  const { route } = useRouter();
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1} key={route}><View /></main>
      <Footer />
      <MobileBar />
      <div className="curtain" aria-hidden="true" />
    </>
  );
}

export default function App() {
  return <RouterProvider><Shell /></RouterProvider>;
}
