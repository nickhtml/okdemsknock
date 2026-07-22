import React, { useState, useEffect } from "react";
import { 
  Crown, 
  RefreshCw, 
  AlertCircle, 
  ExternalLink 
} from "lucide-react";
import MetricToggle from "./components/MetricToggle";
import CampaignRow, { cleanCampaignData, getCandidateImageUrl } from "./components/CampaignRow";
// @ts-ignore
import okDemsLogo from "../assets/OKDems Logo.png";

/**
 * @interface CampaignData
 * @description Structure of individual campaign record rows parsed from the Google Sheet.
 */
interface CampaignData {
  committee_name: string;
  week_start: string;
  doors_attempted: number;
  doors_canvassed: number;
}

const HARDCODED_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1Jxc1SIxRkpqDwIWJK_lFAKJpLcNDuFymu3dXUr5h9-Q/edit?usp=sharing";

/**
 * @component App
 * @description The main dashboard application for OKDEMS Top Knockers.
 * Features auto-loading from the hardcoded voter-canvass Google Sheet, clean candidate name
 * parsing, initials badge rendering, and a high-contrast campaign design language with zero AI styling.
 */
export default function App(): React.JSX.Element {
  const [metric, setMetric] = useState<"doors_attempted" | "doors_canvassed">("doors_attempted");
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Sync data from the active Google Sheets export endpoint
  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Auto-detect standard Google Sheet link and rewrite it to a direct CSV export endpoint
      const sheetMatch = HARDCODED_SPREADSHEET_URL.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetMatch) {
        throw new Error("Invalid Google Sheets URL format configured.");
      }
      
      const sheetId = sheetMatch[1];
      const cleanUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      const response = await fetch(cleanUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const parsedCampaigns = parseCSV(text);
      
      if (parsedCampaigns.length > 0) {
        setCampaigns(parsedCampaigns);
        setLastUpdated(new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short"
        }));
      } else {
        throw new Error("Could not parse campaign data from Sheet CSV. Make sure headers match exactly: committee_name, week_start, doors_attempted, doors_canvassed");
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError("There has been an error loading the Coordinated Campaign Leaderboard. Please verify your web connection, or ensure the source spreadsheet is shared publicly.");
    } finally {
      setIsLoading(false);
    }
  };

  // Safe client-side CSV parser
  const parseCSV = (text: string): CampaignData[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) return [];
    
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    
    const colIndices = {
      committeeName: headers.indexOf("committee_name") !== -1 ? headers.indexOf("committee_name") : 0,
      weekStart: headers.indexOf("week_start") !== -1 ? headers.indexOf("week_start") : 1,
      doorsAttempted: headers.indexOf("doors_attempted") !== -1 ? headers.indexOf("doors_attempted") : 2,
      doorsCanvassed: headers.indexOf("doors_canvassed") !== -1 ? headers.indexOf("doors_canvassed") : 3
    };

    const parsed: CampaignData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const row = parseLine(line);
      const committeeName = row[colIndices.committeeName] || "";
      if (!committeeName) continue;
      
      parsed.push({
        committee_name: committeeName,
        week_start: row[colIndices.weekStart] || "",
        doors_attempted: parseInt(row[colIndices.doorsAttempted], 10) || 0,
        doors_canvassed: parseInt(row[colIndices.doorsCanvassed], 10) || 0
      });
    }
    
    return parsed;
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const [championImgFailed, setChampionImgFailed] = useState(false);

  // Sort campaigns descending by the active toggled metric
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const valA = metric === "doors_attempted" ? a.doors_attempted : a.doors_canvassed;
    const valB = metric === "doors_attempted" ? b.doors_attempted : b.doors_canvassed;
    return valB - valA;
  });

  const topCampaign = sortedCampaigns[0];
  const runnersUp = sortedCampaigns.slice(1); // Ranks #2 downwards

  useEffect(() => {
    setChampionImgFailed(false);
  }, [topCampaign?.committee_name]);

  // Calculate high performance champion relative data
  const topScore = topCampaign 
    ? (metric === "doors_attempted" ? topCampaign.doors_attempted : topCampaign.doors_canvassed)
    : 0;

  // Extract candidate details for the #1 Champion card
  const championInfo = topCampaign ? cleanCampaignData(topCampaign.committee_name) : null;
  const championImgUrl = championInfo ? getCandidateImageUrl(championInfo.candidateName) : null;

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-between font-sans text-slate-900 selection:bg-[#0b2d5a] selection:text-white relative">
      
      {/* Main Campaign Header */}
      <header className="bg-[#0b2d5a] border-b-4 border-slate-900 px-6 py-6 md:py-8 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col items-center md:flex-row gap-4 text-center md:text-left w-full justify-center md:justify-start">
            <img 
              src={okDemsLogo} 
              alt="OKDEMS Logo" 
              className="h-12 md:h-16 w-auto object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                DOOR MVPS
              </h1>
              <p className="text-xs md:text-sm text-blue-100 font-bold uppercase tracking-wider mt-1.5">
                Coordinated Campaign Leaderboard
              </p>
            </div>
          </div>
          
          <div className="shrink-0 self-center md:self-auto">
            <MetricToggle metric={metric} onChange={setMetric} />
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12">
        {isLoading ? (
          <div id="loader-view" className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw className="animate-spin text-[#0b2d5a]" size={48} />
            <p className="text-slate-600 font-black text-xs uppercase tracking-widest text-center">
              Synchronizing with Coordinated Canvass Database...
            </p>
          </div>
        ) : error ? (
          <div id="error-view" className="bg-white border-4 border-slate-900 rounded-none p-8 max-w-xl mx-auto text-center space-y-5 my-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="inline-flex p-3 bg-red-100 border-2 border-slate-900 rounded-none text-[#d9381e]">
              <AlertCircle size={36} />
            </div>
            <h3 className="text-xl font-black uppercase text-slate-950 tracking-tight">
              Leaderboard Synchronization Failed
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {error}
            </p>
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={fetchLeaderboardData}
                className="bg-[#0b2d5a] hover:bg-[#0b2d5a]/90 text-white font-black text-xs py-3 px-6 border-2 border-slate-900 rounded-none uppercase tracking-wider transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div id="empty-state-view" className="bg-white border-4 border-slate-900 rounded-none p-12 text-center max-w-xl mx-auto space-y-5 my-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="inline-flex p-3 bg-blue-50 border-2 border-slate-900 rounded-none text-[#0b2d5a]">
              <RefreshCw size={36} className="animate-spin" />
            </div>
            <h3 className="text-xl font-black text-slate-950 uppercase">
              No Campaign Records
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              We are currently querying the official OKDems Coordinated database. If this takes too long, please check your network connection.
            </p>
          </div>
        ) : (
          <div id="leaderboard-workspace" className="space-y-10 animate-fadeIn">
            
            {/* CHAMPION HERO CARD (Rank #1) */}
            {topCampaign && championInfo && (
              <div 
                id="champion-podium-card"
                className="bg-[#0b2d5a] text-white border-4 border-slate-900 rounded-none p-5 md:p-6 pt-10 md:pt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative shadow-[5px_5px_0px_0px_rgba(15,23,42,1)]"
              >
                {/* Decorative Top-Left Trim Banner */}
                <div id="champion-badge" className="absolute top-0 left-0 bg-[#fbc02d] text-slate-950 text-[10px] md:text-xs font-black px-3.5 py-1.5 border-r-2 border-b-2 border-slate-900 uppercase tracking-widest">
                  Top Campaign This Week
                </div>
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 flex-1">
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Compact Avatar */}
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white border-3 border-slate-900 text-[#0b2d5a] flex items-center justify-center font-black text-xl md:text-2xl tracking-wider shrink-0 select-none shadow overflow-hidden">
                      {championImgUrl && !championImgFailed ? (
                        <img 
                          src={championImgUrl} 
                          alt={championInfo.candidateName} 
                          referrerPolicy="no-referrer"
                          onError={() => setChampionImgFailed(true)} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        championInfo.initials
                      )}
                    </div>
                    <div className="text-left">
                      <h2 id="champion-name" className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight leading-none uppercase">
                        {championInfo.candidateName}
                      </h2>
                      <p className="text-xs md:text-sm text-[#fbc02d] font-bold uppercase tracking-wider mt-1.5">
                        {championInfo.office}
                      </p>
                    </div>
                  </div>
                  
                  {/* Big bold stats blocks - numbers are the focus! */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 flex-1 lg:max-w-md w-full">
                    <div className="bg-[#082143]/60 p-3.5 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                      <span className="text-[9px] md:text-[10px] text-white/70 font-black uppercase tracking-wider block mb-1">
                        Doors Attempted
                      </span>
                      <span id="champion-attempted-val" className={`text-2xl md:text-3xl font-black tracking-tight ${metric === "doors_attempted" ? "text-[#fbc02d]" : "text-white"}`}>
                        {new Intl.NumberFormat().format(topCampaign.doors_attempted)}
                      </span>
                    </div>
                    <div className="bg-[#082143]/60 p-3.5 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                      <span className="text-[9px] md:text-[10px] text-white/70 font-black uppercase tracking-wider block mb-1">
                        Doors Canvassed
                      </span>
                      <span id="champion-canvassed-val" className={`text-2xl md:text-3xl font-black tracking-tight ${metric === "doors_canvassed" ? "text-[#fbc02d]" : "text-white"}`}>
                        {new Intl.NumberFormat().format(topCampaign.doors_canvassed)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hide Crown entirely on Mobile */}
                <div className="hidden md:block bg-[#fbc02d] p-2.5 rounded-none border-2 border-slate-900 text-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0 self-center">
                  <Crown size={28} className="animate-pulse" />
                </div>
              </div>
            )}

            {/* RUNNER-UP PROGRESS TRACKER */}
            <div className="space-y-4">
              <h3 className="text-[10px] sm:text-xs font-black text-slate-500 tracking-widest uppercase pb-2 border-b-2 border-slate-900 flex flex-row items-center justify-between gap-2">
                <span className="truncate">Data Updated Every Morning</span>
              </h3>
              
              <div id="runners-up-grid" className="flex flex-col gap-3">
                {runnersUp.length > 0 ? (
                  runnersUp.map((campaign, idx) => (
                    <CampaignRow
                      key={`${campaign.committee_name}-${idx}`}
                      rank={idx + 2}
                      committeeName={campaign.committee_name}
                      score={metric === "doors_attempted" ? campaign.doors_attempted : campaign.doors_canvassed}
                      topScore={topScore}
                      index={idx}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 bg-white border-2 border-slate-300 rounded-none">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                      No matching runner-up campaigns found in the dataset.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Persistent Footer Row */}
      <footer className="bg-white border-t-4 border-slate-900 px-6 py-8 mt-12 text-center text-xs text-slate-700 font-bold uppercase tracking-wider">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="inline-block bg-slate-100 border-2 border-slate-900 px-4 py-2 font-black text-[10px] md:text-xs">
            Paid for and authorized by the Oklahoma Democratic Party © 2026
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 pt-2">
            <a 
              href="mailto:digitools@okdemocrats.org" 
              className="hover:text-[#0b2d5a] underline decoration-2 underline-offset-4 transition-colors font-extrabold"
            >
              Report Issue
            </a>
            <span className="text-slate-300">|</span>
            <a 
              href="https://www.okdemocrats.org/Terms-Policies" 
              target="_blank" 
              referrerPolicy="no-referrer" 
              className="hover:text-[#0b2d5a] underline decoration-2 underline-offset-4 transition-colors font-extrabold"
            >
              Privacy Policy
            </a>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-normal">An OKDEMS Digital Experience</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
