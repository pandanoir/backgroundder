import { Temporal } from '@js-temporal/polyfill';
import { Card, Grid, Link } from '@nextui-org/react';
import { FC, ComponentProps } from 'react';

export const Tweet: FC<{
  text: string;
  createdAt: string;
  authorId: string;
  tweetId: string;
  backgroundColor?: ComponentProps<typeof Card>['color'];
  foregroundColor?: ComponentProps<typeof Link>['color'];
}> = ({
  text,
  createdAt,
  authorId,
  tweetId,
  backgroundColor,
  foregroundColor,
}) => (
  <Card css={{ width: 300 }} clickable cover color={backgroundColor}>
    <Card.Body>
      <Link
        href={`https://twitter.com/${authorId}/status/${tweetId}`}
        target="_blank"
        color={foregroundColor}
        css={{
          padding: 'var(--nextui-space-sm) var(--nextui-space-lg)',
          ...(backgroundColor === 'primary' ? { color: '$white' } : null),
        }}
      >
        <Grid.Container>
          <span>{text}</span>
          <time style={{ fontSize: 'small' }} dateTime={createdAt}>
            {Temporal.Instant.from(createdAt).toLocaleString()}
          </time>
        </Grid.Container>
      </Link>
    </Card.Body>
  </Card>
);
