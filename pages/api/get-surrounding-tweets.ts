import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  MultipleTweetsLookupResponse,
  APITweet,
  SingleTweetLookupResponse,
} from 'twitter-types';
import { Temporal } from '@js-temporal/polyfill';

export type GetSurroundingTweetsResponse = {
  before: APITweet[];
  after: APITweet[];
  target_tweet: APITweet;
};
type ErrorResponse = {
  title: string;
};

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const appendSearchParams = (
  url: string,
  params: { [key in string]: string }
) => {
  const res = new URL(url);
  for (const key of Object.keys(params)) {
    res.searchParams.append(key, params[key]);
  }
  return res.toString();
};

const lookupTweet = (tweetId: string): Promise<SingleTweetLookupResponse> =>
  fetch(
    appendSearchParams(`https://api.twitter.com/2/tweets/${tweetId}`, {
      'tweet.fields':
        'attachments,author_id,context_annotations,created_at,entities,id,public_metrics,text,withheld',
    }),
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    }
  ).then((res) => res.json());

const lookupSurroundingTweets = async (
  tweetId: string
): Promise<MultipleTweetsLookupResponse> => {
  const {
    data: { author_id: userId, created_at: createdAt },
  } = await lookupTweet(tweetId);

  const endTime = Temporal.Instant.from(createdAt)
    .add({
      hours: 1,
    })
    .toString();
  return fetch(
    appendSearchParams(`https://api.twitter.com/2/users/${userId}/tweets`, {
      end_time: endTime,
      max_results: '100',
      'tweet.fields':
        'attachments,author_id,context_annotations,created_at,entities,id,public_metrics,text,withheld',
    }),
    {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    }
  ).then((res) => res.json());
};
export default async (
  req: NextApiRequest,
  res: NextApiResponse<GetSurroundingTweetsResponse | ErrorResponse>
) => {
  try {
    if (typeof ACCESS_TOKEN !== 'string')
      throw new Error('ACCESS_TOKEN is undefined');

    const targetTweetUrl = req.query.target_tweet_url as string;
    const tweetId: unknown = targetTweetUrl.match(
      new RegExp(String.raw`https://twitter.com/.+?/status/(\d+)`)
    )[1];
    if (typeof tweetId !== 'string')
      throw new Error('invalid tweetId was given');

    const responseFromTwitter = await lookupSurroundingTweets(tweetId).catch(
      () => {
        throw new Error('fetching surrounding tweets failed');
      }
    );

    const indicatedTweetIndex = responseFromTwitter.data.findIndex(
      ({ id }) => id === tweetId
    );
    if (indicatedTweetIndex === -1) throw new Error('fetching failed');

    res.status(200).json({
      after: responseFromTwitter.data.slice(0, indicatedTweetIndex).slice(-5),
      target_tweet: responseFromTwitter.data[indicatedTweetIndex],
      before: responseFromTwitter.data
        .slice(indicatedTweetIndex + 1)
        .slice(0, 5),
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      res.status(500).json({ title: e.message });
    } else res.status(500).json({ title: 'unknown error' });
  }
};
