'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { UserPublicProfile } from '@/components/layout/user_public_profile'

type ViewerType = 'anonymous' | 'athlete' | 'trainer'

interface ProfilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  viewerType: ViewerType
}

const viewerLabels: Record<ViewerType, { label: string; description: string; badgeClass: string }> = {
  anonymous: {
    label: 'Anonymous Visitor',
    description: 'This is how someone who is not logged in sees your profile.',
    badgeClass: 'bg-gray-100 text-gray-700',
  },
  athlete: {
    label: 'An Athlete',
    description: 'This is how a logged-in athlete sees your profile.',
    badgeClass: 'bg-green-100 text-green-700',
  },
  trainer: {
    label: 'Another Trainer',
    description: 'This is how a fellow trainer sees your profile.',
    badgeClass: 'bg-purple-100 text-purple-700',
  },
}

export function ProfilePreviewDialog({ open, onOpenChange, userId, viewerType }: ProfilePreviewDialogProps) {
  const viewer = viewerLabels[viewerType]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <div className="flex items-center gap-3">
            <DialogTitle>Profile Preview</DialogTitle>
            <Badge className={viewer.badgeClass}>{viewer.label}</Badge>
          </div>
          <DialogDescription>{viewer.description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <UserPublicProfile
            userId={userId}
            variant="massitree"
            showActions={false}
            previewAs={viewerType}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
