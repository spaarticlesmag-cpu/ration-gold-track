import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface VerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiary: {
    id: string;
    full_name: string | null;
    ration_card_number: string | null;
    ration_card_type: 'yellow' | 'pink' | 'blue' | 'white' | null;
    verification_status: 'pending' | 'verified' | 'rejected' | 'expired' | null;
    verification_notes: string | null;
    aadhaar_document_url: string | null;
    ration_card_document_url: string | null;
    government_id: string | null;
    card_issue_date: string | null;
    card_expiry_date: string | null;
  };
  onVerificationComplete: () => void;
}

const VerificationDialog = ({ isOpen, onClose, beneficiary, onVerificationComplete }: VerificationDialogProps) => {
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'rejected' | 'expired'>('verified');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!verificationNotes.trim() && verificationStatus === 'rejected') {
      toast({
        title: "Verification Notes Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('verify_ration_card', {
        profile_id: beneficiary.id,
        verification_status: verificationStatus,
        verification_notes: verificationNotes.trim() || null,
        verified_by_uuid: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Verification Updated",
        description: `Ration card verification status updated to ${verificationStatus}.`,
      });

      onVerificationComplete();
      onClose();
    } catch (error) {
      logger.error('Error updating verification:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to update verification status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'expired':
        return 'bg-orange-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Verify Ration Card
            {getStatusIcon(beneficiary.verification_status || 'pending')}
          </DialogTitle>
          <DialogDescription>
            Review and verify the ration card information for {beneficiary.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(beneficiary.verification_status || 'pending')} text-white`}
            >
              {beneficiary.verification_status || 'pending'}
            </Badge>
          </div>

          {/* Card Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Ration Card Number</Label>
              <p className="text-sm text-muted-foreground">{beneficiary.ration_card_number || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Card Type</Label>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  beneficiary.ration_card_type === 'yellow' ? 'bg-yellow-500' :
                  beneficiary.ration_card_type === 'pink' ? 'bg-pink-500' :
                  beneficiary.ration_card_type === 'blue' ? 'bg-blue-500' :
                  'bg-gray-300 border'
                }`}></div>
                <span className="text-sm capitalize">{beneficiary.ration_card_type || 'Not specified'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Government ID</Label>
              <p className="text-sm text-muted-foreground">{beneficiary.government_id || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Card Issue Date</Label>
              <p className="text-sm text-muted-foreground">
                {beneficiary.card_issue_date ? new Date(beneficiary.card_issue_date).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Card Expiry Date</Label>
              <p className="text-sm text-muted-foreground">
                {beneficiary.card_expiry_date ? new Date(beneficiary.card_expiry_date).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Documents</Label>
              <div className="space-y-1">
                {beneficiary.aadhaar_document_url && (
                  <a 
                    href={beneficiary.aadhaar_document_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Aadhaar Document
                  </a>
                )}
                {beneficiary.ration_card_document_url && (
                  <a 
                    href={beneficiary.ration_card_document_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Ration Card Document
                  </a>
                )}
                {!beneficiary.aadhaar_document_url && !beneficiary.ration_card_document_url && (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                )}
              </div>
            </div>
          </div>

          {/* Verification Decision */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-status">Verification Status</Label>
              <Select value={verificationStatus} onValueChange={(value) => setVerificationStatus(value as 'verified' | 'rejected' | 'expired')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select verification status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Verified
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      Rejected
                    </div>
                  </SelectItem>
                  <SelectItem value="expired">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      Expired
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="verification-notes">Verification Notes</Label>
              <Textarea
                id="verification-notes"
                placeholder="Add notes about the verification decision..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
              />
              {verificationStatus === 'rejected' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Notes are required when rejecting a ration card.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Verification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDialog;
