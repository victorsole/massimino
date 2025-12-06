'use client';

import React, { useState } from 'react';
import { ProgramSEO } from '@/types/program';

interface ShareBarProps {
  programName: string;
  programUrl: string;
  seo?: ProgramSEO;
}

export function ShareBar({ programName, programUrl, seo }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const shareText = seo?.share_text || {
    instagram: `Check out ${programName} on Massimino! #MassiminoFitness`,
    tiktok: `${programName} - Get fit with Massimino #fitness #workout`,
    twitter: `I'm starting ${programName} on @MassiminoFitness! ${programUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(programUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareInstagram = () => {
    // Instagram doesn't have a direct web share API, so we copy text and show instructions
    navigator.clipboard.writeText(shareText.instagram);
    alert('Caption copied! Open Instagram and paste in your story or post.');
  };

  const handleShareTikTok = () => {
    // TikTok also doesn't have direct web share, copy caption
    navigator.clipboard.writeText(shareText.tiktok);
    alert('Caption copied! Open TikTok and paste in your video description.');
  };

  const handleShareTwitter = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText.twitter
    )}`;
    window.open(tweetUrl, '_blank', 'width=550,height=420');
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      programUrl
    )}`;
    window.open(fbUrl, '_blank', 'width=550,height=420');
  };

  return (
    <div className="bg-white border-b border-gray-200 py-3 px-6">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500">
          Share this program
        </span>
        <div className="flex gap-2">
          <ShareButton
            onClick={handleShareInstagram}
            icon="mdi-instagram"
            label="Instagram"
            className="bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white"
          />
          <ShareButton
            onClick={handleShareTikTok}
            icon="mdi-music-note"
            label="TikTok"
            className="bg-black text-white"
          />
          <ShareButton
            onClick={handleShareTwitter}
            icon="mdi-twitter"
            label="Twitter"
            className="bg-[#1da1f2] text-white"
          />
          <ShareButton
            onClick={handleShareFacebook}
            icon="mdi-facebook"
            label="Facebook"
            className="bg-[#1877f2] text-white"
          />
          <ShareButton
            onClick={handleCopyLink}
            icon={copied ? 'mdi-check' : 'mdi-link-variant'}
            label={copied ? 'Copied!' : 'Copy Link'}
            className="bg-[#fcf8f2] text-gray-700 border border-gray-200"
          />
        </div>
      </div>
    </div>
  );
}

interface ShareButtonProps {
  onClick: () => void;
  icon: string;
  label: string;
  className: string;
}

function ShareButton({ onClick, icon, label, className }: ShareButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-110 ${className}`}
    >
      <span className={`mdi ${icon} text-lg`} />
    </button>
  );
}

export default ShareBar;
