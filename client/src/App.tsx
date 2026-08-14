import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingButtons from "./components/FloatingButtons";
import AIChatAdvisor from "./components/AIChatAdvisor";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Process from "./pages/Process";
import Testimonials from "./pages/Testimonials";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Cases from "./pages/Cases";
import Blog from "./pages/Blog";
import AdminLogin from "./pages/AdminLogin";
import AdminDebug from "./pages/AdminDebug";
import CMSDashboard from "./pages/CMSDashboard";
import CMSPages from "./pages/CMSPages";
import CMSServices from "./pages/CMSServices";
import CMSCases from "./pages/CMSCases";
import CMSBlogs from "./pages/CMSBlogs";
import CMSBookings from "./pages/CMSBookings";
import CMSContacts from "./pages/CMSContacts";
import CMSMedia from "./pages/CMSMedia";
import CMSSettings from "./pages/CMSSettings";
import CMSSEO from "./pages/CMSSEO";
import CMSMenus from "./pages/CMSMenus";
import CMSFAQs from "./pages/CMSFAQs";
import CMSHero from "./pages/CMSHero";
import CMSFooter from "./pages/CMSFooter";
import CMSReviews from "./pages/CMSReviews";
import CMSPrices from "./pages/CMSPrices";
import CMSUsers from "./pages/CMSUsers";

import FloatingContactMenu from "@/components/FloatingContactMenu";
import SEOHead from "@/components/SEOHead";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/services"} component={Services} />
        <Route path={"/about"} component={About} />
        <Route path={"/process"} component={Process} />
        <Route path={"/testimonials"} component={Testimonials} />
        <Route path={"/faq"} component={FAQ} />
        <Route path={"/contact"} component={Contact} />
        <Route path={"/cases"} component={Cases} />
        <Route path={"/blog"} component={Blog} />

        <Route path={"/admin/login"} component={AdminLogin} />
        <Route path={"/admin/debug"} component={AdminDebug} />
        <Route path={"/cms"} component={CMSDashboard} />
        <Route path={"/cms/pages"} component={CMSPages} />
        <Route path={"/cms/services"} component={CMSServices} />
        <Route path={"/cms/cases"} component={CMSCases} />
        <Route path={"/cms/blogs"} component={CMSBlogs} />
        <Route path={"/cms/bookings"} component={CMSBookings} />
        <Route path={"/cms/contacts"} component={CMSContacts} />
        <Route path={"/cms/media"} component={CMSMedia} />
        <Route path={"/cms/settings"} component={CMSSettings} />
        <Route path={"/cms/seo"} component={CMSSEO} />
        <Route path={"/cms/menus"} component={CMSMenus} />
        <Route path={"/cms/faqs"} component={CMSFAQs} />
        <Route path={"/cms/hero"} component={CMSHero} />
        <Route path={"/cms/footer"} component={CMSFooter} />
        <Route path={"/cms/reviews"} component={CMSReviews} />
        <Route path={"/cms/prices"} component={CMSPrices} />
        <Route path={"/cms/users"} component={CMSUsers} />

        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const [location] = useLocation();
  const isAdminArea = location === "/admin/login" || location === "/admin/debug" || location.startsWith("/cms");

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          {!isAdminArea && <FloatingButtons />}
          {!isAdminArea && <AIChatAdvisor />}
          {!isAdminArea && <FloatingContactMenu />}
          {!isAdminArea && <SEOHead pathname={location} />}
          <div className="min-h-screen flex flex-col">
            {!isAdminArea && <Header />}
            <main className="flex-grow">
              <Router />
            </main>
            {!isAdminArea && <Footer />}
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
