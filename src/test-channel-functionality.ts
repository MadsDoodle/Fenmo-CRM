// Test file to validate channel management functionality
import { 
  getStatusOptionsForChannel, 
  LINKEDIN_STATUS_SEQUENCE, 
  EMAIL_STATUS_SEQUENCE,
  DEFAULT_STATUS_SEQUENCE,
  CHANNEL_FROM_OPTIONS,
  type ChannelType 
} from './lib/status-config';

// Test 1: Channel From Options
console.log('=== Channel From Options Test ===');
console.log('Available channels:', CHANNEL_FROM_OPTIONS.map(c => c.label));

// Test 2: LinkedIn Sequence
console.log('\n=== LinkedIn Status Sequence Test ===');
const linkedinStatuses = getStatusOptionsForChannel('linkedin');
console.log('LinkedIn sequence:', linkedinStatuses.map(s => s.label));
console.log('Expected sequence:', LINKEDIN_STATUS_SEQUENCE);

// Test 3: Email Sequence  
console.log('\n=== Email Status Sequence Test ===');
const emailStatuses = getStatusOptionsForChannel('email');
console.log('Email sequence:', emailStatuses.map(s => s.label));
console.log('Expected sequence:', EMAIL_STATUS_SEQUENCE);

// Test 4: Default Sequence (for phone, sms, whatsapp)
console.log('\n=== Default Status Sequence Test ===');
const defaultStatuses = getStatusOptionsForChannel('phone');
console.log('Default sequence:', defaultStatuses.map(s => s.label));
console.log('Expected sequence:', DEFAULT_STATUS_SEQUENCE);

// Test 5: Null channel handling
console.log('\n=== Null Channel Test ===');
const nullChannelStatuses = getStatusOptionsForChannel(null);
console.log('Null channel sequence:', nullChannelStatuses.map(s => s.label));

// Test 6: Validate all sequences have proper labels
console.log('\n=== Label Validation Test ===');
const testChannels: (ChannelType | null)[] = ['linkedin', 'email', 'phone', 'sms', 'whatsapp', null];

testChannels.forEach(channel => {
  const statuses = getStatusOptionsForChannel(channel);
  const hasInvalidLabels = statuses.some(s => !s.label || s.label.includes('_'));
  console.log(`${channel || 'null'} channel - All labels valid: ${!hasInvalidLabels}`);
  if (hasInvalidLabels) {
    console.log('  Invalid labels found:', statuses.filter(s => !s.label || s.label.includes('_')));
  }
});

export {};
