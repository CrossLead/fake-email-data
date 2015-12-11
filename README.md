## Fake email corpus from known hirearchy

Create a set of email data with email addresses of your choosing, assigned by corporate hirearchy as estimated using
the [EventRank algorithm](http://www.datalab.uci.edu/papers/linkkdd05-02.pdf) through the [gak NodeJS library](https://github.com/CrossLead/gak).

### Requirements

- Mongodb
- [NodeJS >= 0.10](https://nodejs.org/en/)

Steps...

```
+--------------+         +------------------+          +-----------------+
|              |         |                  |          | Assign desired  |
|Download Email+-------> | Rank Individuals +--------> | email addresses |
|    Corpus    |         |  In Email using  |          | To emails using |
|              |         |   EVentRank      |          |  ranks          |
+--------------+         +------------------+          +-----------------+
```
