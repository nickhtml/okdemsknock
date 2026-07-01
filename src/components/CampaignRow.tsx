import React, { useState } from "react";
import { motion } from "motion/react";

/**
 * Known Oklahoma Democratic candidate images mapped to official and public sources.
 */
export const CANDIDATE_IMAGES: Record<string, string> = {
  "cyndi munson": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Cyndi_Munson.jpg/300px-Cyndi_Munson.jpg",
  "jason lowe": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Jason_Lowe.jpg/300px-Jason_Lowe.jpg",
  "trish ranson": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Trish_Ranson.jpg/300px-Trish_Ranson.jpg",
  "john croisant": "https://images.squarespace-cdn.com/content/v1/640f8231cf7b196be11d3326/5d109f07-8ec9-482d-886f-3b7c858d4a97/Croisant_Headshot_Square.jpg",
  "chaunte gilmore": "https://images.squarespace-cdn.com/content/v1/64c3f59e44ea8b6e6fb1bf67/a9cb3ebc-6f81-42cb-b168-fc62ce0ca17d/Headshot.jpg",
  "jena nelson": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Jena_Nelson_2022.jpg/300px-Jena_Nelson_2022.jpg",
  "dalton gau": "https://images.squarespace-cdn.com/content/v1/5dd5c9e1732e482276527ba7/ca0be534-5853-4f9b-980b-224422e1180b/Dalton+Gau.png"
};

/**
 * Resolves a candidate image URL based on their name.
 * @param {string} name - Candidate name.
 * @returns {string | null} Mapped image URL or null if not found.
 */
export function getCandidateImageUrl(name: string): string | null {
  const norm = name.toLowerCase().trim();
  for (const [key, value] of Object.entries(CANDIDATE_IMAGES)) {
    if (norm.includes(key) || key.includes(norm)) {
      return value;
    }
  }
  return null;
}


/**
 * @interface CleanCampaignInfo
 * @description Structure of parsed and clean candidate information.
 */
export interface CleanCampaignInfo {
  candidateName: string;
  office: string;
  initials: string;
  isCandidate: boolean;
}

/**
 * @interface CampaignRowProps
 * @description Type definitions for the CampaignRow component properties.
 */
interface CampaignRowProps {
  /** React key property */
  key?: React.Key;
  /** The 1-based numeric rank of the campaign in the leaderboard */
  rank: number;
  /** The raw committee name string from the Google Sheets dataset */
  committeeName: string;
  /** The door count score value for this campaign (either attempted or canvassed) */
  score: number;
  /** The score of the absolute rank #1 campaign, used for relative scaling of progress bars */
  topScore: number;
  /** The zero-based index of this row within the listed rows, used for staggered entrance animation */
  index: number;
}

/**
 * Cleanly extracts candidate name, office, and initials from raw campaign committee names.
 * @param {string} rawName - The original uncleaned campaign committee name.
 * @returns {CleanCampaignInfo} The parsed campaign info.
 */
export function cleanCampaignData(rawName: string): CleanCampaignInfo {
  if (!rawName) {
    return { candidateName: "Unknown Campaign", office: "OKDems Campaign", initials: "OK", isCandidate: false };
  }

  let name = rawName.trim();
  let office = "";
  let isCandidate = true;

  // 1. Check for Partner prefix
  if (name.startsWith("Partner - ")) {
    name = name.replace("Partner - ", "").trim();
    office = "Campaign Partner";
    isCandidate = false;
  } 
  // 2. Check for other non-candidate lines
  else if (name === "Oklahoma Democratic Party") {
    office = "State Party";
    isCandidate = false;
  } else if (name === "Democrats of Tulsa County") {
    name = "Tulsa County Democrats";
    office = "County Party";
    isCandidate = false;
  } else if (name === "DNC National Committeewoman") {
    office = "DNC Office";
    isCandidate = false;
  }
  // 3. Parse candidates with codes like "HD.100.2026 - Chaunte Gilmore For State House"
  else {
    const hyphenIndex = name.indexOf("-");
    if (hyphenIndex !== -1) {
      const codePart = name.substring(0, hyphenIndex).trim();
      let candidatePart = name.substring(hyphenIndex + 1).trim();

      // Clean up the code part to look nice (e.g. "CD.01.2026" -> "CD-01")
      const cleanCode = codePart
        .replace(/\.202\d$/, "") // remove year like .2026 or .2027
        .replace(/\./g, "-");     // CD.01 -> CD-01

      // Check for "for" or "For" separator
      const forMatch = candidatePart.match(/\s+for\s+/i);
      if (forMatch) {
        const parts = candidatePart.split(/\s+for\s+/i);
        name = parts[0].trim();
        let rawOffice = parts[1].trim();
        // Beautify office name
        if (rawOffice.toLowerCase() === "congress") {
          office = `US Congress (${cleanCode})`;
        } else if (rawOffice.toLowerCase().includes("state house") || rawOffice.toLowerCase().includes("house") || rawOffice.toLowerCase().includes("state representative")) {
          office = `State House (${cleanCode})`;
        } else if (rawOffice.toLowerCase().includes("state senate") || rawOffice.toLowerCase().includes("senate")) {
          office = `State Senate (${cleanCode})`;
        } else if (rawOffice.toLowerCase().includes("city council")) {
          office = `City Council (${cleanCode})`;
        } else {
          office = `${rawOffice} (${cleanCode})`;
        }
      } else {
        // No "for" keyword, just use candidatePart as name
        name = candidatePart;
        office = cleanCode;
      }
    }
  }

  // 4. Generate initials
  const nameParts = name.split(/\s+/).filter(Boolean);
  let initials = "OK";
  if (nameParts.length >= 2) {
    initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  } else if (nameParts.length === 1) {
    initials = nameParts[0].substring(0, 2).toUpperCase();
  }

  return {
    candidateName: name,
    office: office || "OKDems Campaign",
    initials,
    isCandidate
  };
}

// Flat background colors for initials avatar
const AVATAR_COLORS = [
  "bg-[#0b2d5a] text-white border-2 border-slate-900",
  "bg-[#d9381e] text-white border-2 border-slate-900",
  "bg-[#007a87] text-white border-2 border-slate-900",
  "bg-[#2e7d32] text-white border-2 border-slate-900",
  "bg-[#ef6c00] text-white border-2 border-slate-900",
  "bg-[#6a1b9a] text-white border-2 border-slate-900",
  "bg-[#00838f] text-white border-2 border-slate-900",
];

const getAvatarColorClass = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

/**
 * @component CampaignRow
 * @description A high-contrast, robust row element featuring a bold rank indicator,
 * candidate initials badge, candidate name, clean office subtitle, progress bar, and score.
 */
export default function CampaignRow({
  rank,
  committeeName,
  score,
  topScore,
  index,
}: CampaignRowProps): React.JSX.Element {
  const { candidateName, office, initials } = cleanCampaignData(committeeName);
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = getCandidateImageUrl(candidateName);
  
  // Calculate relative progress width percentage
  const progressPercent = topScore > 0 ? Math.min(100, Math.max(0, (score / topScore) * 100)) : 0;
  
  // Formatting helper for numbers
  const formattedScore = new Intl.NumberFormat().format(score);
  const colorClass = getAvatarColorClass(candidateName);

  return (
    <motion.div
      id={`campaign-row-${rank}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03, ease: "easeOut" }}
      className="grid grid-cols-[36px_44px_1fr_100px] md:grid-cols-[40px_48px_1.5fr_3fr_120px] items-center gap-3 p-3.5 bg-white border-2 border-slate-900 rounded-none shadow-[2px_2px_0px_rgba(15,23,42,1)] hover:shadow-[4px_4px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Rank Indicator */}
      <span id={`campaign-rank-${rank}`} className="font-black text-slate-900 text-lg md:text-xl select-none text-center">
        {String(rank).padStart(2, "0")}
      </span>

      {/* Styled Initials Avatar or Candidate Photo */}
      <div 
        id={`campaign-avatar-${rank}`}
        className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center font-black text-sm md:text-base tracking-wider shadow-sm select-none overflow-hidden ${colorClass}`}
      >
        {imageUrl && !imgFailed ? (
          <img 
            src={imageUrl} 
            alt={candidateName} 
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)} 
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      {/* Candidate Name & Office */}
      <div className="flex flex-col min-w-0 pr-2">
        <span id={`campaign-name-${rank}`} className="font-extrabold text-sm md:text-base text-slate-900 truncate">
          {candidateName}
        </span>
        <span id={`campaign-office-${rank}`} className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-tight truncate mt-0.5">
          {office}
        </span>
      </div>

      {/* Relative Progress Bar (visible only on md and larger) */}
      <div id={`campaign-progress-container-${rank}`} className="hidden md:block h-3.5 bg-slate-100 border border-slate-300 rounded-none overflow-hidden mx-4 relative">
        <motion.div
          id={`campaign-progress-bar-${rank}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, delay: 0.1 + index * 0.02, ease: "easeOut" }}
          className="h-full bg-[#0b2d5a] border-r border-slate-900"
        />
      </div>

      {/* Numeric Score */}
      <div id={`campaign-score-${rank}`} className="text-right flex flex-col justify-center">
        <span className="font-black text-base md:text-lg text-slate-900 font-mono">
          {formattedScore}
        </span>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">
          Doors
        </span>
      </div>
    </motion.div>
  );
}
