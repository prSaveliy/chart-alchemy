# Chart Alchemy

### Web application for data visualization using LLM

### Work in progress
 - currently implementing OpenID Connect
 
 
# Labs

## 1. Generators and Iterators

The file containing the implementation of this task is located at **/backend/src/utils/generateRandomString.ts**

The main goal is to generate a random string that will be used in the account activation link after the user successfully registers.

 - Generator: infinitely yields a random latin letter (**50%** chance of uppercase)
 - Timeout Iterator Function: consumes the iterator for a certain number of seconds (passed as a parameter), appending each letter to the end result and delaying the next iteration for **0.1 sec**, making the random string exactly **30 letters** long (in case of 3 sec timeout).

 ### Integration
These functions are used in **/backend/src/services/auth.service.ts** (lines 26 & 27)

```ts
const iter = randomLetterGenerator();
const activationLink = await generateString(iter, 3);
```