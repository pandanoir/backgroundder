import Head from 'next/head';
import { FC, useEffect, useState } from 'react';
import { GetSurroundingTweetsResponse } from './api/get-surrounding-tweets';
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom';
import {
  Button,
  Grid,
  Input,
  Loading,
  NextUIProvider,
  Tooltip,
} from '@nextui-org/react';
import { Tweet } from '../components/Tweet';

const useSurroundingTweets = () => {
  const [targetTweetURL, setTargetTweetURL] = useState(
    'https://twitter.com/le_panda_noir/status/1512729556859293696'
  );
  const [previousTweets, setPreviousTweets] = useState<
    GetSurroundingTweetsResponse['before']
  >([]);
  const [followingTweets, setFollowingTweets] = useState<
    GetSurroundingTweetsResponse['after']
  >([]);
  const [targetTweet, setTargetTweet] = useState<
    GetSurroundingTweetsResponse['target_tweet'] | null
  >(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!targetTweetURL.startsWith('https://twitter.com')) {
      return;
    }
    setLoading(true);

    fetch(
      'https://tf6djch1ol.execute-api.us-east-1.amazonaws.com/default/get-surrounding-tweets',
      {
        method: 'POST',
        mode: 'cors',
        headers: {
          'x-api-key': '1Xz2BMbs355KWurKMiIfMaG56eiz5wqqEEE9BkQ8ODODOD',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,x-api-key',
        },
        body: JSON.stringify({
          target_tweet_url: targetTweetURL,
        }),
      }
    )
      .then((response) => response.json())
      .then(
        ({
          before,
          after,
          target_tweet: targetTweet,
        }: GetSurroundingTweetsResponse) => {
          batchedUpdates(() => {
            setPreviousTweets(before);
            setFollowingTweets(after);
            setTargetTweet(targetTweet);
            setLoading(false);
          });
        }
      )
      .finally(() => {
        setLoading(false);
      });
  }, [targetTweetURL]);
  return {
    setTargetTweetURL,
    targetTweet,
    followingTweets,
    previousTweets,
    loading,
  } as const;
};
const Home: FC = () => {
  const {
    setTargetTweetURL,
    targetTweet,
    followingTweets,
    previousTweets,
    loading,
  } = useSurroundingTweets();

  return (
    <div className="container">
      <Head>
        <title>Backgroundder</title>
      </Head>
      <NextUIProvider>
        <div style={{ display: 'grid' }}>
          <div
            style={{
              gridArea: '1/-1',
            }}
          >
            <Tooltip
              content={
                <>
                  Backgroundder
                  は特定のツイート後1時間以内のツイートを表示します。
                  <br />
                  前後それぞれ最大5件まで表示されます。
                  <br />
                  APIの仕様上、1年以上前のツイートについては機能しません。
                </>
              }
              hideArrow
              placement="bottomStart"
            >
              <Button auto flat rounded>
                ?
              </Button>
            </Tooltip>
          </div>
          <div
            style={{
              gridArea: '1/-1',
            }}
          >
            <Grid.Container
              direction="column"
              alignItems="center"
              justify="center"
              css={
                targetTweet === null && !loading ? { height: '100vh' } : null
              }
            >
              <div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setTargetTweetURL(
                      (event.target as HTMLFormElement).elements[
                        'target tweet url'
                      ].value
                    );
                  }}
                >
                  <Grid.Container gap={1} alignItems="flex-end">
                    <Grid>
                      <Input
                        name="target tweet url"
                        label="前後を知りたいツイートのURL:"
                        type="url"
                        placeholder="https://twitter.com/username/status/xxxxx"
                        animated={false}
                        width="30em"
                      />
                    </Grid>
                    <Grid>
                      <Button type="submit">調べる</Button>
                    </Grid>
                  </Grid.Container>
                </form>
              </div>
            </Grid.Container>
          </div>
          {loading && (
            <Grid.Container direction="column" gap={1} alignItems="center">
              <Loading />
            </Grid.Container>
          )}
          {targetTweet !== null && (
            <Grid.Container direction="column" gap={1} alignItems="center">
              {followingTweets.map((x) => (
                <Grid>
                  <Tweet
                    text={x.text}
                    createdAt={x.created_at}
                    authorId={x.author_id}
                    tweetId={x.id}
                  />
                </Grid>
              ))}
              <Grid>
                <Tweet
                  text={targetTweet.text}
                  createdAt={targetTweet.created_at}
                  authorId={targetTweet.author_id}
                  tweetId={targetTweet.id}
                  backgroundColor="primary"
                />
              </Grid>
              {previousTweets.map((x) => (
                <Grid>
                  <Tweet
                    text={x.text}
                    createdAt={x.created_at}
                    authorId={x.author_id}
                    tweetId={x.id}
                  />
                </Grid>
              ))}
            </Grid.Container>
          )}
        </div>
      </NextUIProvider>
    </div>
  );
};

export default Home;
