import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AIChatAdvisor from "./components/AIChatAdvisor";
import Home from "./pages/Home";
import FloatingContactMenu from "@/components/FloatingContactMenu";
import SEOHead from "@/components/SEOHead";

const NotFound = lazy(() => import("@/pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Process = lazy(() => import("./pages/Process"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const Cases = lazy(() => import("./pages/Cases"));
const Blog = lazy(() => import("./pages/Blog"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDebug = lazy(() => import("./pages/AdminDebug"));
const CMSDashboard = lazy(() => import("./pages/CMSDashboard"));
const CMSPages = lazy(() => import("./pages/CMSPages"));
const CMSServices = lazy(() => import("./pages/CMSServices"));
const CMSCases = lazy(() => import("./pages/CMSCases"));
const CMSBlogs = lazy(() => import("./pages/CMSBlogs"));
const CMSBookings = lazy(() => import("./pages/CMSBookings"));
const CMSContacts = lazy(() => import("./pages/CMSContacts"));
const CMSMedia = lazy(() => import("./pages/CMSMedia"));
const CMSSettings = lazy(() => import("./pages/CMSSettings"));
const CMSSEO = lazy(() => import("./pages/CMSSEO"));
const CMSMenus = lazy(() => import("./pages/CMSMenus"));
const CMSFAQs = lazy(() => import("./pages/CMSFAQs"));
const CMSHero = lazy(() => import("./pages/CMSHero"));
const CMSFooter = lazy(() => import("./pages/CMSFooter"));
const CMSReviews = lazy(() => import("./pages/CMSReviews"));
const CMSPrices = lazy(() => import("./pages/CMSPrices"));
const CMSUsers = lazy(() => import("./pages/CMSUsers"));
const CMSCopywriting = lazy(() => import("./pages/CMSCopywriting"));
const HRDashboard = lazy(() => import("./pages/hr/HRDashboard"));
const HREmployees = lazy(() => import("./pages/hr/HREmployees"));
const HRSchedule = lazy(() => import("./pages/hr/HRSchedule"));
const HRAttendance = lazy(() => import("./pages/hr/HRAttendance"));
const HROvertime = lazy(() => import("./pages/hr/HROvertime"));
const HRPayroll = lazy(() => import("./pages/hr/HRPayroll"));
const HRAdvances = lazy(() => import("./pages/hr/HRAdvances"));
const HRCompensation = lazy(() => import("./pages/hr/HRCompensation"));
const HRPayslip = lazy(() => import("./pages/hr/HRPayslip"));
const HRReport = lazy(() => import("./pages/hr/HRReport"));

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
          載入頁面中…
        </div>
      }
    >
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
        <Route path={"/cms/copywriting"} component={CMSCopywriting} />

        <Route path={"/hr"} component={HRDashboard} />
        <Route path={"/hr/employees"} component={HREmployees} />
        <Route path={"/hr/schedule"} component={HRSchedule} />
        <Route path={"/hr/attendance"} component={HRAttendance} />
        <Route path={"/hr/overtime"} component={HROvertime} />
        <Route path={"/hr/payroll"} component={HRPayroll} />
        <Route path={"/hr/advances"} component={HRAdvances} />
        <Route path={"/hr/compensation"} component={HRCompensation} />
        <Route path={"/hr/payslips"} component={HRPayslip} />
        <Route path={"/hr/reports"} component={HRReport} />

        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const [location] = useLocation();
  const isAdminArea = location === "/admin/login" || location === "/admin/debug" || location.startsWith("/cms") || location.startsWith("/hr");

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
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
