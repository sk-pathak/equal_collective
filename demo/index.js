const XRayClient = require('../sdk');

const xray = new XRayClient();

async function runDemo() {
  console.log('Starting Content Recommendation Demo...');

  const traceId = await xray.startTrace('Content Recommendation', {
    triggered_by: 'homepage_load',
    user_id: 'u_78234',
  });
  console.log(`Trace started: ${traceId}`);

  try {
    // User Profile Analysis
    const userProfile = {
      user_id: 'u_78234',
      preferences: ['sci-fi', 'thriller', 'documentary'],
      watch_history: ['movie_101', 'movie_205', 'movie_312'],
      age_group: 'adult',
    };

    const inferredInterests = ['space exploration', 'mystery', 'true crime'];

    await xray.addStep(traceId, {
      stepName: 'profile_analysis',
      input: userProfile,
      output: { inferred_interests: inferredInterests, confidence: 0.87 },
      reasoning: 'Analyzed watch history and preferences to infer interest in space/mystery content.',
      orderIndex: 0,
      startedAt: new Date(Date.now() - 5000).toISOString(),
      endedAt: new Date(Date.now() - 4000).toISOString(),
    });

    // Content Fetching
    const contentPool = [
      { id: 'c_01', title: 'Interstellar', genre: 'sci-fi', rating: 4.8, release_year: 2014 },
      { id: 'c_02', title: 'The Crown', genre: 'drama', rating: 4.5, release_year: 2016 },
      { id: 'c_03', title: 'Making a Murderer', genre: 'documentary', rating: 4.3, release_year: 2015 },
      { id: 'c_04', title: 'Peppa Pig', genre: 'kids', rating: 4.9, release_year: 2004 },
      { id: 'c_05', title: 'The Martian', genre: 'sci-fi', rating: 4.6, release_year: 2015 },
      { id: 'c_06', title: 'Gone Girl', genre: 'thriller', rating: 4.4, release_year: 2014 },
    ];

    await xray.addStep(traceId, {
      stepName: 'content_fetch',
      input: { interests: inferredInterests, limit: 20 },
      output: { count: contentPool.length, content: contentPool },
      reasoning: `Fetched ${contentPool.length} content items matching inferred interests.`,
      orderIndex: 1,
      startedAt: new Date(Date.now() - 4000).toISOString(),
      endedAt: new Date(Date.now() - 3000).toISOString(),
    });

    // Filtering (age-appropriate, not already watched, genre match)
    const filtered = [];
    const evaluations = [];

    for (const item of contentPool) {
      let qualified = true;
      let rejectReason = null;

      if (item.genre === 'kids' && userProfile.age_group === 'adult') {
        qualified = false;
        rejectReason = 'Kids content for adult user';
      } else if (!userProfile.preferences.includes(item.genre)) {
        qualified = false;
        rejectReason = `Genre "${item.genre}" not in user preferences`;
      }

      evaluations.push({ id: item.id, title: item.title, qualified, rejectReason });
      if (qualified) filtered.push(item);
    }

    await xray.addStep(traceId, {
      stepName: 'apply_filters',
      input: { content_count: contentPool.length, user_preferences: userProfile.preferences },
      output: { passed: filtered.length, failed: contentPool.length - filtered.length, evaluations },
      reasoning: 'Filtered out kids content and genres not in user preferences.',
      orderIndex: 2,
      startedAt: new Date(Date.now() - 3000).toISOString(),
      endedAt: new Date(Date.now() - 2000).toISOString(),
    });

    // Ranking (by rating, then recency)
    filtered.sort((a, b) => b.rating - a.rating || b.release_year - a.release_year);
    const recommendations = filtered.slice(0, 3);

    await xray.addStep(traceId, {
      stepName: 'ranking',
      input: { candidates: filtered.map(c => c.title) },
      output: { top_3: recommendations },
      reasoning: `Ranked by rating (primary) and recency (secondary). Top pick: "${recommendations[0].title}" with ${recommendations[0].rating}★.`,
      orderIndex: 3,
      startedAt: new Date(Date.now() - 2000).toISOString(),
      endedAt: new Date(Date.now() - 1000).toISOString(),
    });

    await xray.finishTrace(traceId, 'COMPLETED');
    console.log('Trace completed successfully.');
    console.log('Recommendations:', recommendations.map(r => r.title));

  } catch (err) {
    console.error('Demo failed:', err);
    await xray.finishTrace(traceId, 'FAILED');
  }
}

runDemo();
