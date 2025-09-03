/**
 * Custom Moderation Rules for Massimino
 * Fitness-specific content moderation rules and pattern matching
 */

import type { 
    ModerationResult, 
    ModerationContext,
    CustomModerationRule,
    FitnessViolationType 
  } from '@/types/moderation';
  import { ModerationAction, ModerationSource, ViolationType } from '@prisma/client';
  
  // ============================================================================
  // FITNESS-SPECIFIC VIOLATION PATTERNS
  // ============================================================================
  
  /**
   * Patterns that are specifically problematic in fitness contexts
   * These go beyond general content moderation to catch fitness-specific issues
   */
  const FITNESS_VIOLATION_PATTERNS: Record<FitnessViolationType, CustomModerationRule> = {
    INAPPROPRIATE_PERSONAL_COMMENTS: {
      id: 'inappropriate-personal',
      name: 'Inappropriate Personal Comments',
      description: 'Comments focusing on appearance rather than fitness performance',
      category: ViolationType.INAPPROPRIATE_CONTENT,
      enabled: true,
      severity: 4,
      confidence: 0.8,
      patterns: [
        'nice body',
        'sexy',
        'hot',
        'beautiful body',
        'gorgeous',
        'stunning',
        'attractive',
        'cute butt',
        'nice curves',
      ],
      keywords: [
        'body', 'sexy', 'hot', 'beautiful', 'gorgeous', 'stunning', 
        'attractive', 'cute', 'curves', 'butt', 'chest', 'legs'
      ],
      regexPatterns: [
        '\\b(nice|great|amazing|sexy|hot)\\s+(body|figure|physique|curves|butt|chest|legs)\\b',
        '\\b(you\\s+look|looking)\\s+(sexy|hot|amazing|gorgeous|stunning)\\b',
        '\\b(beautiful|gorgeous|stunning)\\s+(woman|girl|lady|man|guy)\\b',
      ],
      contexts: ['POST', 'COMMENT', 'MESSAGE'],
      userRoles: ['CLIENT', 'TRAINER'],
      communityTypes: ['PUBLIC', 'PRIVATE'],
      action: ModerationAction.FLAGGED,
      autoBlock: false,
      requireHumanReview: true,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      usageCount: 0,
    },
  
    UNSOLICITED_PERSONAL_ATTENTION: {
      id: 'unsolicited-attention',
      name: 'Unsolicited Personal Attention',
      description: 'Unwanted personal attention or creepy behavior',
      category: ViolationType.HARASSMENT,
      enabled: true,
      severity: 5,
      confidence: 0.9,
      patterns: [
        'want to meet',
        'hook up',
        'private session',
        'one on one',
        'dm me',
        'text me',
        'my number is',
        'call me',
        'date',
        'dinner',
        'drinks',
      ],
      keywords: [
        'meet', 'hook', 'private', 'personal', 'dm', 'text', 'call', 
        'number', 'date', 'dinner', 'drinks', 'relationship'
      ],
      regexPatterns: [
        '\\b(want\\s+to|let\'s)\\s+(meet|hook\\s+up|get\\s+together)\\b',
        '\\b(private|personal)\\s+(session|training|meeting)\\b',
        '\\b(dm|text|call)\\s+me\\b',
        '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b', // Phone numbers
        '\\b[\\w._%+-]+@[\\w.-]+\\.[A-Z]{2,}\\b', // Email addresses
      ],
      contexts: ['COMMENT', 'MESSAGE', 'POST'],
      userRoles: ['CLIENT', 'TRAINER'],
      communityTypes: ['PUBLIC', 'PRIVATE'],
      action: ModerationAction.BLOCKED,
      autoBlock: true,
      requireHumanReview: true,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      usageCount: 0,
    },
  
    FAKE_TRAINER_CREDENTIALS: {
      id: 'fake-credentials',
      name: 'Fake Trainer Credentials',
      description: 'False claims about certifications or credentials',
      category: ViolationType.IMPERSONATION,
      enabled: true,
      severity: 4,
      confidence: 0.7,
      patterns: [
        'certified trainer',
        'NASM certified',
        'ACE certified',
        'ACSM certified',
        'personal trainer license',
        'nutrition specialist',
        'registered dietitian',
      ],
      keywords: [
        'certified', 'certification', 'license', 'credential', 'specialist', 
        'NASM', 'ACE', 'ACSM', 'NSCA', 'RD', 'registered', 'dietitian'
      ],
      regexPatterns: [
        '\\b(certified|licensed)\\s+(trainer|nutritionist|dietitian)\\b',
        '\\b(NASM|ACE|ACSM|NSCA)\\s+certified\\b',
        '\\bregistered\\s+dietitian\\b',
      ],
      contexts: ['PROFILE', 'POST', 'COMMENT'],
      userRoles: ['CLIENT'], // Only flag clients claiming credentials
      communityTypes: ['PUBLIC', 'PRIVATE'],
      action: ModerationAction.FLAGGED,
      autoBlock: false,
      requireHumanReview: true,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      usageCount: 0,
    },
  
    UNSAFE_EXERCISE_ADVICE: {
      id: 'unsafe-advice',
      name: 'Unsafe Exercise Advice',
      description: 'Potentially dangerous exercise recommendations',
      category: ViolationType.OFF_TOPIC,
      enabled: true,
      severity: 4,
      confidence: 0.6,
      patterns: [
        'no pain no gain',
        'push through the pain',
        'pain is weakness leaving',
        'ignore the pain',
        'max out every day',
        'train every day',
        'no rest days',
        'more is always better',
      ],
      keywords: [
        'pain', 'ignore', 'push', 'through', 'max', 'every', 'day',
        'no', 'rest', 'dangerous', 'extreme', 'hardcore'
      ],
      regexPatterns: [
        '\\b(no\\s+pain\\s+no\\s+gain|push\\s+through\\s+the\\s+pain)\\b',
        '\\b(ignore\\s+the\\s+pain|pain\\s+is\\s+weakness)\\b',
        '\\b(train|workout)\\s+every\\s+day\\b',
        '\\bno\\s+rest\\s+days?\\b',
      ],
      contexts: ['POST', 'COMMENT', 'MESSAGE'],
      userRoles: ['CLIENT', 'TRAINER'],
      communityTypes: ['PUBLIC', 'PRIVATE'],
      action: ModerationAction.FLAGGED,
      autoBlock: false,
      requireHumanReview: true,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      usageCount: 0,
    },
  
    SUPPLEMENT_SPAM: {
      id: 'supplement-spam',
      name: 'Supplement Spam',
      description: 'Unauthorized supplement promotions or MLM content',
      category: ViolationType.SPAM,
      enabled: true,
      severity: 3,
      confidence: 0.8,
      patterns: [
        'buy now',
        'limited time',
        'special offer',
        'discount code',
        'affiliate link',
        'earn money',
        'join my team',
        'business opportunity',
        'work from home',
        'supplement deal',
      ],
      keywords: [
        'buy', 'sale', 'discount', 'offer', 'deal', 'affiliate', 
        'earn', 'money', 'team', 'business', 'opportunity', 'MLM'
      ],
      regexPatterns: [
        '\\b(buy\\s+now|limited\\s+time|special\\s+offer)\\b',
        '\\b(discount\\s+code|promo\\s+code)\\b',
        '\\b(join\\s+my\\s+team|business\\s+opportunity)\\b',
        '\\b(work\\s+from\\s+home|earn\\s+money)\\b',
      ],
      contexts: ['POST', 'COMMENT', 'MESSAGE'],
      userRoles: ['CLIENT', 'TRAINER'],
      communityTypes: ['PUBLIC'],
      action: ModerationAction.BLOCKED,
      autoBlock: true,
      requireHumanReview: false,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      usageCount: 0,
    },
  
    BODY_SHAMING: {
      id: 'body-shaming',
      name: 'Body Shaming',
      description: 'Negative comments about body size, shape, or appearance',
      category: ViolationType.HARASSMENT,
      enabled: true,
      severity: 4,
      confidence: 0.9,
      patterns: [
        'too fat',
        'too skinny',
        'gross',
        'disgusting',
        'ugly',
        'pathetic',
        'weak',
        'lazy',
        'no excuse',
        'just eat less',
        'try harder',
      ],
      keywords: [
        'fat', 'skinny', 'gross', 'disgusting', 'ugly', 'pathetic', 
        'weak', 'lazy', 'excuse', 'eat', 'less', 'harder'
      ],
      regexPatterns: [
        '\\b(too\\s+(fat|skinny|weak)|gross|disgusting|ugly)\\b',
        '\\b(just\\s+(eat\\s+less|try\\s+harder)|no\\s+excuse)\\b',
        '\\b(lazy|pathetic|weak)\\s+(person|people)\\b',
      ],
      contexts: ['POST', 'COMMENT', 'MESSAGE'],
      userRoles: ['CLIENT', 'TRAINER'],
      communityTypes: ['PUBLIC', 'PRIVATE'],
      action: ModerationAction.BLOCKED,
      autoBlock: true,
      requireHumanReview: true,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      usageCount: 0,
    },
  
    NUTRITION_MISINFORMATION: {
      id: 'nutrition-misinfo',
      name: 'Nutrition Misinformation',
      description: 'False or dangerous nutritional advice',
      category: ViolationType.OFF_TOPIC,
      enabled: true,
      severity: 3,
      confidence: 0.6,
      patterns: [
        'detox tea',
        'cleanse',
        'magic pill',
        'lose weight fast',
        'burn fat instantly',
        'no exercise needed',
        'eat whatever you want',
        'miracle cure',
      ],
      keywords: [
        'detox', 'cleanse', 'magic', 'pill', 'fast', 'instant', 
        'miracle', 'cure', 'secret', 'trick'
      ],
      regexPatterns: [
        '\\b(detox|cleanse|magic\\s+pill)\\b',
        '\\b(lose\\s+weight\\s+fast|burn\\s+fat\\s+instantly)\\b',
        '\\b(no\\s+exercise\\s+needed|eat\\s+whatever)\\b',
        '\\b(miracle\\s+cure|secret\\s+trick)\\b',
      ],
      contexts: ['POST', 'COMMENT'],
      userRoles: ['CLIENT', 'TRAINER'],
      communityTypes: ['PUBLIC'],
      action: ModerationAction.FLAGGED,
      autoBlock: false,
      requireHumanReview: true,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      usageCount: 0,
    },
  
    PREDATORY_TRAINING_OFFERS: {
      id: 'predatory-offers',
      name: 'Predatory Training Offers',
      description: 'Exploitative or manipulative business practices',
      category: ViolationType.HARASSMENT,
      enabled: true,
      severity: 4,
      confidence: 0.8,
      patterns: [
        'pay upfront',
        'no refunds',
        'must decide now',
        'pressure',
        'guilt',
        'shame',
        'failure',
        'only way',
        'guaranteed results',
      ],
      keywords: [
        'upfront', 'refunds', 'decide', 'now', 'pressure', 'guilt', 
        'shame', 'failure', 'only', 'way', 'guaranteed'
      ],
      regexPatterns: [
        '\\b(pay\\s+upfront|no\\s+refunds)\\b',
        '\\b(must\\s+decide\\s+now|limited\\s+spots)\\b',
        '\\b(guaranteed\\s+results|only\\s+way)\\b',
      ],
      contexts: ['MESSAGE', 'POST'],
      userRoles: ['TRAINER'],
      communityTypes: ['PRIVATE', 'PUBLIC'],
      action: ModerationAction.FLAGGED,
      autoBlock: false,
      requireHumanReview: true,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      usageCount: 0,
    },
  
    OFF_TOPIC_CONTENT: {
      id: 'off-topic',
      name: 'Off-Topic Content',
      description: 'Content not related to fitness, health, or wellness',
      category: ViolationType.OFF_TOPIC,
      enabled: true,
      severity: 2,
      confidence: 0.5,
      patterns: [
        'politics',
        'religion',
        'cryptocurrency',
        'stock market',
        'real estate',
        'dating',
        'relationship',
        'celebrity gossip',
      ],
      keywords: [
        'politics', 'political', 'religion', 'religious', 'crypto', 
        'bitcoin', 'stocks', 'investment', 'real', 'estate', 'dating', 
        'relationship', 'celebrity', 'gossip'
      ],
      regexPatterns: [
        '\\b(politics|political|religion|religious)\\b',
        '\\b(crypto|bitcoin|stock\\s+market)\\b',
        '\\b(real\\s+estate|dating|relationship)\\b',
      ],
      contexts: ['POST', 'COMMENT'],
      userRoles: ['CLIENT', 'TRAINER'],
      communityTypes: ['PUBLIC'],
      action: ModerationAction.FLAGGED,
      autoBlock: false,
      requireHumanReview: false,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      usageCount: 0,
    },
  
    PRIVACY_INVASION: {
      id: 'privacy-invasion',
      name: 'Privacy Invasion',
      description: 'Sharing personal information without consent',
      category: ViolationType.PRIVACY_VIOLATION,
      enabled: true,
      severity: 5,
      confidence: 0.9,
      patterns: [
        'real name is',
        'address is',
        'phone number',
        'works at',
        'lives in',
        'goes to gym',
      ],
      keywords: [
        'name', 'address', 'phone', 'number', 'works', 'lives', 
        'gym', 'location', 'personal', 'private'
      ],
      regexPatterns: [
        '\\b(real\\s+name|full\\s+name)\\s+is\\b',
        '\\b(address|phone\\s+number)\\s+is\\b',
        '\\b(works\\s+at|lives\\s+in|goes\\s+to)\\b',
      ],
      contexts: ['POST', 'COMMENT', 'MESSAGE'],
      userRoles: ['CLIENT', 'TRAINER'],
      communityTypes: ['PUBLIC', 'PRIVATE'],
      action: ModerationAction.BLOCKED,
      autoBlock: true,
      requireHumanReview: true,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      usageCount: 0,
    },
  };
  
  // ============================================================================
  // RULE APPLICATION ENGINE
  // ============================================================================
  
  /**
   * Apply custom fitness-specific moderation rules
   */
  export async function applyCustomRules(
    content: string,
    context: ModerationContext
  ): Promise<ModerationResult> {
    const violations: Array<{
      rule: CustomModerationRule;
      matches: string[];
      confidence: number;
    }> = [];
  
    // Check each rule against the content
    for (const rule of Object.values(FITNESS_VIOLATION_PATTERNS)) {
      if (!rule.enabled) continue;
      
      // Check if rule applies to this context
      if (!isRuleApplicable(rule, context)) continue;
      
      const matches = findRuleMatches(content, rule);
      
      if (matches.length > 0) {
        violations.push({
          rule,
          matches,
          confidence: calculateRuleConfidence(rule, matches, content),
        });
      }
    }
  
    // If no violations found, approve the content
    if (violations.length === 0) {
      return createApprovedResult();
    }
  
    // Find the most severe violation
    const primaryViolation = violations.reduce((max, current) => 
      current.rule.severity > max.rule.severity ? current : max
    );
  
    // Create moderation result based on the primary violation
    return createCustomRuleResult(primaryViolation, violations, content);
  }
  
  /**
   * Check if a rule applies to the current context
   */
  function isRuleApplicable(rule: CustomModerationRule, context: ModerationContext): boolean {
    // Check content type context
    const contentType = context.isInPrivateMessage ? 'MESSAGE' : 'POST';
    if (!rule.contexts.includes(contentType as any)) {
      return false;
    }
  
    // Check community type
    if (!rule.communityTypes.includes(context.communityType)) {
      return false;
    }
  
    // For trainer-specific rules, check if author is trainer
    if (rule.userRoles.includes('TRAINER') && !rule.userRoles.includes('CLIENT')) {
      return context.isTrainerToClient;
    }
  
    return true;
  }
  
  /**
   * Find matches for a rule in content
   */
  function findRuleMatches(content: string, rule: CustomModerationRule): string[] {
    const matches: string[] = [];
    const lowerContent = content.toLowerCase();
  
    // Check simple patterns
    for (const pattern of rule.patterns) {
      if (lowerContent.includes(pattern.toLowerCase())) {
        matches.push(pattern);
      }
    }
  
    // Check keyword combinations
    const contentWords = lowerContent.split(/\s+/);
    for (const keyword of rule.keywords) {
      if (contentWords.some(word => word.includes(keyword.toLowerCase()))) {
        matches.push(keyword);
      }
    }
  
    // Check regex patterns
    if (rule.regexPatterns) {
      for (const regex of rule.regexPatterns) {
        const regexMatches = content.match(regex);
        if (regexMatches) {
          matches.push(...regexMatches);
        }
      }
    }
  
    return [...new Set(matches)]; // Remove duplicates
  }
  
  /**
   * Calculate confidence score for rule match
   */
  function calculateRuleConfidence(
    rule: CustomModerationRule,
    _matches: string[],
    _content: string
  ): number {
    let confidence = rule.confidence;
  
    // Increase confidence based on number of matches
    const matchBonus = Math.min(_matches.length * 0.1, 0.3);
    confidence += matchBonus;
  
    // Decrease confidence for longer content (might be false positive)
    if (_content.length > 500) {
      confidence *= 0.9;
    }
  
    // Increase confidence for exact pattern matches
    const exactMatches = _matches.filter(match => 
      rule.patterns.some(pattern => 
        match.toLowerCase() === pattern.toLowerCase()
      )
    );
    
    if (exactMatches.length > 0) {
      confidence += 0.1;
    }
  
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Create moderation result for custom rule violation
   */
  function createCustomRuleResult(
    primaryViolation: { rule: CustomModerationRule; matches: string[]; confidence: number },
    allViolations: Array<{ rule: CustomModerationRule; matches: string[]; confidence: number }>,
    _content: string
  ): ModerationResult {
    const { rule, confidence } = primaryViolation;
  
    const categories = allViolations.map(v => ({
      category: v.rule.name,
      subcategory: v.rule.category,
      severity: v.rule.severity,
      confidence: v.confidence,
      description: v.rule.description,
    }));
  
    return {
      action: rule.action,
      flagged: rule.action !== ModerationAction.APPROVED,
      blocked: rule.action === ModerationAction.BLOCKED,
      confidence,
      reason: `Content flagged for: ${rule.description}`,
      categories,
      source: ModerationSource.CUSTOM_RULES,
      moderatedAt: new Date(),
      requiresHumanReview: rule.requireHumanReview,
      reviewPriority: rule.severity >= 4 ? 'HIGH' : rule.severity >= 3 ? 'MEDIUM' : 'LOW',
      suggestedAction: rule.severity >= 4 ? 'SUSPEND_3D' : 'WARN',
      appealable: rule.action !== ModerationAction.APPROVED,
    };
  }
  
  /**
   * Create approved result for content that passes all rules
   */
  function createApprovedResult(): ModerationResult {
    return {
      action: ModerationAction.APPROVED,
      flagged: false,
      blocked: false,
      confidence: 0,
      reason: 'Content approved by custom rules',
      categories: [],
      source: ModerationSource.CUSTOM_RULES,
      moderatedAt: new Date(),
      requiresHumanReview: false,
      reviewPriority: 'LOW',
      appealable: false,
    };
  }
  
  // ============================================================================
  // POSITIVE CONTENT DETECTION
  // ============================================================================
  
  /**
   * Detect positive fitness content to boost confidence in approval
   */
  export function detectPositiveFitnessContent(content: string): {
    isFitnessRelated: boolean;
    positiveIndicators: string[];
    confidenceBonus: number;
  } {
    const positiveKeywords = [
      'workout', 'exercise', 'fitness', 'training', 'health', 'wellness',
      'nutrition', 'diet', 'protein', 'cardio', 'strength', 'muscle',
      'motivation', 'progress', 'goals', 'achievement', 'improvement',
      'coach', 'trainer', 'guidance', 'support', 'community', 'journey',
    ];
  
    const encouragingPhrases = [
      'great job', 'well done', 'keep going', 'you can do it', 'proud of you',
      'amazing progress', 'inspiring', 'motivated', 'helpful', 'supportive',
    ];
  
    const foundKeywords = positiveKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    );
  
    const foundPhrases = encouragingPhrases.filter(phrase => 
      content.toLowerCase().includes(phrase)
    );
  
    const isFitnessRelated = foundKeywords.length >= 1;
    const positiveIndicators = [...foundKeywords, ...foundPhrases];
    
    // Calculate confidence bonus (0-0.3)
    const confidenceBonus = Math.min(
      (foundKeywords.length * 0.1) + (foundPhrases.length * 0.15),
      0.3
    );
  
    return {
      isFitnessRelated,
      positiveIndicators,
      confidenceBonus,
    };
  }
  
  // ============================================================================
  // RULE MANAGEMENT
  // ============================================================================
  
  /**
   * Get all active custom rules
   */
  export function getActiveRules(): CustomModerationRule[] {
    return Object.values(FITNESS_VIOLATION_PATTERNS).filter(rule => rule.enabled);
  }
  
  /**
   * Update rule configuration
   */
  export function updateRule(
    ruleId: string, 
    updates: Partial<CustomModerationRule>
  ): boolean {
    const rule = Object.values(FITNESS_VIOLATION_PATTERNS)
      .find(r => r.id === ruleId);
    
    if (!rule) return false;
    
    Object.assign(rule, updates, { lastModified: new Date() });
    return true;
  }
  
  /**
   * Get rule statistics
   */
  export function getRuleStats(): Record<string, { 
    usageCount: number; 
    severity: number; 
    enabled: boolean; 
  }> {
    const stats: Record<string, any> = {};
    
    Object.entries(FITNESS_VIOLATION_PATTERNS).forEach(([key, rule]) => {
      stats[key] = {
        usageCount: rule.usageCount,
        severity: rule.severity,
        enabled: rule.enabled,
      };
    });
    
    return stats;
  }
  
  // ============================================================================
// EXPORT UTILITIES
// ============================================================================

export {
  FITNESS_VIOLATION_PATTERNS,
};

export type { FitnessViolationType, CustomModerationRule };