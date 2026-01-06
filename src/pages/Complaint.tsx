import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NavHeader } from '@/components/NavHeader';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Upload, Send, CheckCircle, AlertTriangle, Package, Truck, Star, Phone, Store } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ComplaintForm {
  category: string;
  orderId?: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  contactPhone: string;
  attachments: File[];
}

interface OrderOption {
  id: string;
  display: string;
  status: string;
}

const Complaint = () => {
  const { profile } = useAuth();
  const [form, setForm] = useState<ComplaintForm>({
    category: '',
    subject: '',
    description: '',
    priority: 'medium',
    contactPhone: profile?.mobile_number || '',
    attachments: []
  });
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState<string>('');

  useEffect(() => {
    // Load user's recent orders for complaint reference
    loadUserOrders();
  }, [profile]);

  const loadUserOrders = () => {
    try {
      const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const userOrders = storedOrders
        .filter((order: any) => order.customer_id === profile?.user_id)
        .slice(0, 10) // Last 10 orders
        .map((order: any) => ({
          id: order.id,
          display: `${order.id.slice(-6)} - ${order.items.join(', ').substring(0, 30)}...`,
          status: order.status
        }));
      setOrders(userOrders);
    } catch (error) {
      logger.error('Error loading orders for complaints:', error);
    }
  };

  const handleInputChange = (field: keyof ComplaintForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 3) {
      alert('Maximum 3 files allowed');
      return;
    }

    // Check file sizes (max 5MB each)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert('Each file must be smaller than 5MB');
      return;
    }

    setForm(prev => ({ ...prev, attachments: files }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.category || !form.subject || !form.description) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Generate complaint ID
      const complaintId = `COMP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      // Prepare complaint data
      const complaintData = {
        id: complaintId,
        user_id: profile?.user_id,
        user_name: profile?.full_name,
        user_email: profile?.id, // Using profile id as email placeholder
        category: form.category,
        order_id: form.orderId || null,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        contact_phone: form.contactPhone,
        status: 'pending',
        created_at: new Date().toISOString(),
        attachments: form.attachments.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      };

      // Store complaint (in real app, this would go to backend)
      const existingComplaints = JSON.parse(localStorage.getItem('complaints') || '[]');
      existingComplaints.push(complaintData);
      localStorage.setItem('complaints', JSON.stringify(existingComplaints));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setComplaintId(complaintId);
      setSubmitted(true);

      logger.info('Complaint submitted:', complaintData);

    } catch (error) {
      logger.error('Error submitting complaint:', error);
      alert('Error submitting complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const complaintCategories = [
    { value: 'order_issue', label: 'Order Related Issue', icon: Package },
    { value: 'delivery_delay', label: 'Delivery Delay', icon: Truck },
    { value: 'quality_issue', label: 'Product Quality Issue', icon: Star },
    { value: 'billing_error', label: 'Billing/Payment Issue', icon: AlertTriangle },
    { value: 'pickup_issue', label: 'Shop Pickup Issue', icon: Store },
    { value: 'app_issue', label: 'App/Website Issue', icon: MessageSquare },
    { value: 'other', label: 'Other', icon: MessageSquare }
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <NavHeader />

        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">Complaint Submitted Successfully!</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Your complaint has been registered and will be reviewed by our support team.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">Complaint Reference ID:</div>
                  <div className="font-mono text-lg font-bold text-gray-800">{complaintId}</div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>What happens next?</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Our team will review your complaint within 24-48 hours</li>
                    <li>• You'll receive updates via SMS/email</li>
                    <li>• Resolution time depends on complaint complexity</li>
                    <li>• You can track status using the reference ID above</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                >
                  Go Home
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Submit Another Complaint
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavHeader />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <MessageSquare className="h-4 w-4" />
            Customer Support
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit a Complaint</h1>
          <p className="text-gray-600">Help us improve our service by reporting any issues you encounter</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Complaint Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Complaint Details
                </CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-base font-medium">Complaint Category *</Label>
                    <Select value={form.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complaint category" />
                      </SelectTrigger>
                      <SelectContent>
                        {complaintCategories.map((category) => {
                          const Icon = category.icon;
                          return (
                            <SelectItem key={category.value} value={category.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {category.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Related Order (if applicable) */}
                  {orders.length > 0 && (
                    <div className="space-y-3">
                      <Label htmlFor="orderId" className="text-base font-medium">Related Order (Optional)</Label>
                      <Select value={form.orderId || ''} onValueChange={(value) => handleInputChange('orderId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select related order (if applicable)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No specific order</SelectItem>
                          {orders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                {order.display}
                                <Badge variant="outline" className="text-xs">
                                  {order.status}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Subject */}
                  <div className="space-y-3">
                    <Label htmlFor="subject" className="text-base font-medium">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="Brief summary of your complaint"
                      value={form.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      required
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-3">
                    <Label htmlFor="priority" className="text-base font-medium">Priority Level</Label>
                    <Select value={form.priority} onValueChange={(value: any) => handleInputChange('priority', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General feedback</SelectItem>
                        <SelectItem value="medium">Medium - Service issue</SelectItem>
                        <SelectItem value="high">High - Significant problem</SelectItem>
                        <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-base font-medium">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide detailed information about your complaint..."
                      value={form.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={6}
                      required
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-3">
                    <Label htmlFor="contactPhone" className="text-base font-medium">Contact Phone *</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="Your contact number"
                      value={form.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      required
                    />
                  </div>

                  {/* File Attachments */}
                  <div className="space-y-3">
                    <Label htmlFor="attachments" className="text-base font-medium">Attachments (Optional)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        id="attachments"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label htmlFor="attachments" className="cursor-pointer">
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            Click to upload photos or documents
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Max 3 files, 5MB each (images, PDF, DOC)
                          </p>
                        </div>
                      </label>
                    </div>

                    {form.attachments.length > 0 && (
                      <div className="space-y-2">
                        {form.attachments.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <Upload className="h-4 w-4" />
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {loading ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Complaint
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Information Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">How We Handle Complaints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h4 className="font-medium">Review</h4>
                      <p className="text-sm text-gray-600">Your complaint is reviewed within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h4 className="font-medium">Investigation</h4>
                      <p className="text-sm text-gray-600">We investigate and gather necessary information</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h4 className="font-medium">Resolution</h4>
                      <p className="text-sm text-gray-600">Issue is resolved with appropriate action</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <h4 className="font-medium">Follow-up</h4>
                      <p className="text-sm text-gray-600">We follow up to ensure satisfaction</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Helpline</p>
                    <p className="text-sm text-gray-600">1800-XXX-XXXX</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-600">support@ration.gov.in</p>
                  </div>
                </div>

                <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <strong>Emergency:</strong> For urgent issues affecting public health or safety, please call the emergency helpline immediately.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complaint;
