import { Toaster } from "@/components/feedback/Toaster";
import { Toaster as Sonner } from "@/components/feedback/Sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "../contexts/Web3Context";
import Index from "./Index";
import NotFound from "./NotFound";
import AdminDashboard from "./AdminDashboard";
import { Profile } from "./Profile";
import { Gallery } from "./Gallery";
import { Forum } from "./Forum";
import { Collaboration } from "./Collaboration";
import { SocialFeed } from "./SocialFeed";
// TODO: Add Mint, Stake, Auction, Governance pages if available

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Web3Provider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/social-feed" element={<SocialFeed />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/collaboration" element={<Collaboration />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </Web3Provider>
  </QueryClientProvider>
);

export default App; 