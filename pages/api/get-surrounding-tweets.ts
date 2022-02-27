import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  MultipleTweetsLookupResponse,
  APITweet,
  SingleTweetLookupResponse,
} from 'twitter-types';
import { Temporal } from '@js-temporal/polyfill';

export type Response = {
  before: APITweet[];
  after: APITweet[];
  target_tweet: APITweet;
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
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const targetTweetUrl = req.query.target_tweet_url as string;
  const tweetId = targetTweetUrl.match(
    new RegExp(String.raw`https://twitter.com/.+?/status/(\d+)`)
  )[1];
  const responseFromTwitter = await lookupSurroundingTweets(tweetId);

  const indicatedTweetIndex = responseFromTwitter.data.findIndex(
    ({ id }) => id === tweetId
  );
  const response: Response = {
    after: responseFromTwitter.data.slice(0, indicatedTweetIndex).slice(-5),
    target_tweet: responseFromTwitter.data[indicatedTweetIndex],
    before: responseFromTwitter.data.slice(indicatedTweetIndex + 1).slice(0, 5),
  };
  res.status(200).json(response);
};
