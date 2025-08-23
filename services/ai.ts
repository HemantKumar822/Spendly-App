import { AICategorizationRequest, AICategorizationResponse, AIInsightRequest, AIInsight, Expense, Budget } from '../types';
import { CATEGORY_KEYWORDS, DEFAULT_CATEGORIES } from '../types/categories';
import { generateId } from '../utils';
import { OPENROUTER_CONFIG, APP_CONFIG, logConfig } from '../config';

// Initialize configuration logging
logConfig();

export class AIService {
  // Simple rule-based categorization (fallback when AI is not available)
  static categorizeBySimilarity(description: string): string {
    const lowercaseDesc = description.toLowerCase();
    
    for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowercaseDesc.includes(keyword)) {
          return categoryId;
        }
      }
    }
    
    return 'misc'; // Default to miscellaneous
  }

  // AI-powered expense categorization
  static async categorizeExpense(request: AICategorizationRequest): Promise<AICategorizationResponse> {
    try {
      // First try rule-based approach
      const ruleBased = this.categorizeBySimilarity(request.description);
      
      // If AI is not enabled, return rule-based result
      if (!APP_CONFIG.ai.enabled || !OPENROUTER_CONFIG.apiKey) {
        console.log('💡 Using rule-based categorization (AI not configured)');
        return {
          categoryId: ruleBased,
          confidence: 0.7,
          reasoning: 'Rule-based categorization (AI service not configured)'
        };
      }

      // Prepare prompt for AI
      const categories = DEFAULT_CATEGORIES.map(cat => `${cat.id}: ${cat.name} (${cat.emoji})`).join('\n');
      
      const prompt = `Categorize this expense for a college student:

Description: "${request.description}"
Amount: ₹${request.amount}

Available categories:
${categories}

Respond with ONLY the category ID (like "food" or "transport"). No explanation needed.`;

      console.log('🤖 Sending request to AI service...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.ai.timeoutMs);

      const response = await fetch(`${OPENROUTER_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: OPENROUTER_CONFIG.headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: OPENROUTER_CONFIG.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expense categorization assistant for college students. Respond with only the category ID from the provided list.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 10,
          temperature: 0.1,
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ AI API error (${response.status}):`, errorText);
        console.log('💡 Falling back to rule-based categorization');
        return {
          categoryId: ruleBased,
          confidence: 0.7,
          reasoning: `AI service error (${response.status}), used rule-based categorization`
        };
      }

      const aiResponse = await response.json();
      const aiCategory = aiResponse.choices[0]?.message?.content?.trim().toLowerCase();
      
      console.log('🤖 AI response:', aiCategory);
      
      // Validate AI response
      const validCategories = DEFAULT_CATEGORIES.map(cat => cat.id);
      const finalCategory = validCategories.includes(aiCategory) ? aiCategory : ruleBased;
      
      console.log('✅ Final category:', finalCategory);
      
      return {
        categoryId: finalCategory,
        confidence: aiCategory === finalCategory ? 0.95 : 0.7,
        reasoning: aiCategory === finalCategory ? 'AI categorization' : 'AI categorization with rule-based fallback'
      };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏱️ AI request timeout, using rule-based categorization');
      } else {
        console.error('❌ Error in AI categorization:', error);
      }
      
      // Fallback to rule-based categorization
      return {
        categoryId: this.categorizeBySimilarity(request.description),
        confidence: 0.7,
        reasoning: 'AI service timeout/error, used rule-based categorization'
      };
    }
  }

  // Generate AI insights about spending patterns
  static async generateInsights(request: AIInsightRequest): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];
      
      // Generate rule-based insights (always available)
      const ruleBasedInsights = this.generateRuleBasedInsights(request.expenses, request.budgets, request.timeframe);
      insights.push(...ruleBasedInsights);

      // Try AI-powered insights if enabled
      if (APP_CONFIG.ai.enabled && OPENROUTER_CONFIG.apiKey) {
        try {
          console.log('🤖 Generating AI insights...');
          const aiInsights = await this.generateAIInsights(request);
          insights.push(...aiInsights);
          console.log(`✅ Generated ${aiInsights.length} AI insights`);
        } catch (error) {
          console.error('❌ AI insights failed, using rule-based only:', error);
        }
      }

      return insights.slice(0, 5); // Return top 5 insights
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      return [];
    }
  }

  // Rule-based insights (always available)
  private static generateRuleBasedInsights(expenses: Expense[], budgets: Budget[], timeframe: 'week' | 'month'): AIInsight[] {
    const insights: AIInsight[] = [];
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    if (expenses.length === 0) {
      return [{
        id: generateId(),
        type: 'tip',
        title: 'Start tracking',
        message: 'Add your first expense to start getting insights about your spending habits!',
        generatedAt: new Date().toISOString()
      }];
    }

    // Category analysis
    const categorySpending = new Map<string, number>();
    expenses.forEach(exp => {
      const current = categorySpending.get(exp.category.id) || 0;
      categorySpending.set(exp.category.id, current + exp.amount);
    });

    const topCategory = Array.from(categorySpending.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (topCategory) {
      const percentage = ((topCategory[1] / totalSpent) * 100).toFixed(0);
      const categoryName = DEFAULT_CATEGORIES.find(cat => cat.id === topCategory[0])?.name || 'Unknown';
      
      insights.push({
        id: generateId(),
        type: percentage > '50' ? 'warning' : 'tip',
        title: 'Top spending category',
        message: `${categoryName} accounts for ${percentage}% of your ${timeframe}ly spending (₹${topCategory[1].toFixed(0)})`,
        category: topCategory[0],
        amount: topCategory[1],
        generatedAt: new Date().toISOString()
      });
    }

    // Budget warnings
    budgets.forEach(budget => {
      if (!budget.isActive) return;
      
      const relevantExpenses = expenses.filter(exp => 
        !budget.categoryId || exp.category.id === budget.categoryId
      );
      const spent = relevantExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const percentage = (spent / budget.amount) * 100;

      if (percentage > 80) {
        insights.push({
          id: generateId(),
          type: percentage > 100 ? 'warning' : 'warning',
          title: percentage > 100 ? 'Budget exceeded' : 'Budget alert',
          message: `You've spent ${percentage.toFixed(0)}% of your ${budget.period}ly budget (₹${spent.toFixed(0)}/₹${budget.amount})`,
          amount: spent,
          generatedAt: new Date().toISOString()
        });
      }
    });

    // Frequency insights
    const dailySpending = new Map<string, number>();
    expenses.forEach(exp => {
      const date = exp.date.split('T')[0];
      const current = dailySpending.get(date) || 0;
      dailySpending.set(date, current + exp.amount);
    });

    const avgDailySpending = totalSpent / Math.max(dailySpending.size, 1);
    
    if (avgDailySpending > 0) {
      insights.push({
        id: generateId(),
        type: 'tip',
        title: 'Daily average',
        message: `Your average daily spending this ${timeframe} is ₹${avgDailySpending.toFixed(0)}`,
        amount: avgDailySpending,
        generatedAt: new Date().toISOString()
      });
    }

    return insights;
  }

  // AI-powered insights
  private static async generateAIInsights(request: AIInsightRequest): Promise<AIInsight[]> {
    const { expenses, budgets, timeframe } = request;
    
    if (!APP_CONFIG.ai.enabled || !OPENROUTER_CONFIG.apiKey || expenses.length === 0) {
      return [];
    }

    try {
      // Prepare data summary for AI
      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const categoryBreakdown = new Map<string, number>();
      
      expenses.forEach(exp => {
        const current = categoryBreakdown.get(exp.category.name) || 0;
        categoryBreakdown.set(exp.category.name, current + exp.amount);
      });

      const categoryData = Array.from(categoryBreakdown.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // Top 5 categories
        .map(([cat, amount]) => `${cat}: ₹${amount.toFixed(0)}`)
        .join(', ');

      const avgPerDay = totalSpent / Math.max(expenses.length, 1);
      
      const prompt = `Analyze this college student's ${timeframe}ly spending and provide exactly 2 actionable insights in JSON array format:

Spending Summary:
- Total: ₹${totalSpent.toFixed(0)}
- Transactions: ${expenses.length}
- Average per transaction: ₹${avgPerDay.toFixed(0)}
- Top categories: ${categoryData}

Return JSON array with 2 objects, each having:
{
  "type": "tip" | "warning" | "achievement",
  "title": "Short title (max 25 chars)",
  "message": "Actionable advice (max 85 chars)"
}

Focus on practical money-saving tips for students.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.ai.timeoutMs);

      const response = await fetch(`${OPENROUTER_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: OPENROUTER_CONFIG.headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: OPENROUTER_CONFIG.model,
          messages: [
            {
              role: 'system',
              content: 'You are a financial advisor for college students. Provide insights as a valid JSON array with exactly 2 objects. Be practical and concise.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.7,
          top_p: 0.9
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`❌ AI insights API error (${response.status})`);
        return [];
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices[0]?.message?.content?.trim();
      
      if (!content) {
        console.log('❌ Empty AI insights response');
        return [];
      }

      // Parse AI response with error handling
      let aiInsights;
      try {
        // Try to extract JSON from response
        const jsonMatch = content.match(/\[.*\]/s);
        if (jsonMatch) {
          aiInsights = JSON.parse(jsonMatch[0]);
        } else {
          aiInsights = JSON.parse(content);
        }
      } catch (parseError) {
        console.log('❌ Failed to parse AI insights JSON:', parseError);
        return [];
      }
      
      // Validate and format insights
      if (!Array.isArray(aiInsights)) {
        console.log('❌ AI insights response is not an array');
        return [];
      }

      return aiInsights
        .filter(insight => insight.title && insight.message)
        .slice(0, 2)
        .map((insight: any) => ({
          id: generateId(),
          type: ['tip', 'warning', 'achievement'].includes(insight.type) ? insight.type : 'tip',
          title: String(insight.title).slice(0, 25),
          message: String(insight.message).slice(0, 85),
          generatedAt: new Date().toISOString()
        }));

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏱️ AI insights request timeout');
      } else {
        console.error('❌ Error generating AI insights:', error);
      }
      return [];
    }
  }

  // Health check for AI service
  static async checkAIServiceHealth(): Promise<{ available: boolean; model: string; error?: string }> {
    try {
      if (!APP_CONFIG.ai.enabled || !OPENROUTER_CONFIG.apiKey) {
        return {
          available: false,
          model: OPENROUTER_CONFIG.model,
          error: 'API key not configured'
        };
      }

      console.log('🔍 Checking AI service health...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${OPENROUTER_CONFIG.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const isHealthy = response.ok;
      console.log(isHealthy ? '✅ AI service is healthy' : '❌ AI service is unhealthy');

      return {
        available: isHealthy,
        model: OPENROUTER_CONFIG.model,
        error: isHealthy ? undefined : `API service unavailable (${response.status})`
      };
    } catch (error) {
      const errorMessage = (error instanceof Error && error.name === 'AbortError') ? 'Request timeout' : 
                          error instanceof Error ? error.message : 'Unknown error';
      
      console.log('❌ AI service health check failed:', errorMessage);
      
      return {
        available: false,
        model: OPENROUTER_CONFIG.model,
        error: errorMessage
      };
    }
  }
}