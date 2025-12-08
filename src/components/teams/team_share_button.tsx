// src/components/teams/team_share_button.tsx
'use client';

/**
 * Team Share Button Component
 * Allows trainers to share their team via link or QR code from the public team page
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Share2, Link2, Copy, QrCode, Check, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface TeamShareButtonProps {
  teamId: string;
  teamName: string;
  accentColor?: string;
}

export function TeamShareButton({
  teamId,
  teamName,
  accentColor = '#2563eb'
}: TeamShareButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateShareableLink = async () => {
    setGeneratingLink(true);
    setError(null);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-invite-link', expiresInDays: 30 })
      });
      const data = await response.json();
      if (data.success && data.data?.inviteUrl) {
        setShareableLink(data.data.inviteUrl);
      } else {
        setError(data.error || 'Failed to generate link');
      }
    } catch (err) {
      setError('Failed to generate shareable link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLinkToClipboard = async () => {
    const linkToCopy = shareableLink || `${window.location.origin}/teams/${teamId}`;
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link');
    }
  };

  const shareLink = async () => {
    const linkToShare = shareableLink || `${window.location.origin}/teams/${teamId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${teamName}`,
          text: `Join my team "${teamName}" on Massimino!`,
          url: linkToShare
        });
      } catch (err) {
        // User cancelled or share failed - fallback to copy
        copyLinkToClipboard();
      }
    } else {
      copyLinkToClipboard();
    }
  };

  const handleOpenDialog = async () => {
    setShowDialog(true);
    if (!shareableLink) {
      await generateShareableLink();
    }
  };

  const currentLink = shareableLink || `${window.location.origin}/teams/${teamId}`;

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        variant="outline"
        className="gap-2"
        style={{ borderColor: accentColor, color: accentColor }}
      >
        <Share2 size={16} />
        Share Team
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share {teamName}</DialogTitle>
            <DialogDescription>
              Share this link to invite people to join your team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Link display */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
              <Link2 size={16} className="text-gray-500 shrink-0" />
              <input
                type="text"
                readOnly
                value={generatingLink ? 'Generating link...' : currentLink}
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
              />
              <button
                onClick={copyLinkToClipboard}
                disabled={generatingLink}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              >
                {linkCopied ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} className="text-gray-600" />
                )}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={shareLink}
                disabled={generatingLink}
                style={{ backgroundColor: accentColor }}
                className="flex-1 text-white"
              >
                {generatingLink ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Share2 size={16} className="mr-2" />
                    Share Link
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowQrCode(!showQrCode)}
                variant="outline"
                className="gap-2"
              >
                <QrCode size={16} />
                {showQrCode ? 'Hide' : 'QR'}
              </Button>
            </div>

            {/* QR Code */}
            {showQrCode && !generatingLink && (
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <QRCodeSVG
                  value={currentLink}
                  size={180}
                  level="M"
                  fgColor={accentColor}
                  includeMargin
                />
              </div>
            )}

            <p className="text-xs text-gray-500 text-center">
              {shareableLink
                ? 'This invite link expires in 30 days'
                : 'Direct link to your team page'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
