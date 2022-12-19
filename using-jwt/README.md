# using-jwt

This example demonstrates how to define and load user objects which can be resolved using a JWT based [identity context](https://www.topaz.sh/docs/authorizer-guide/identity-context).

## Create a user object with an Identity

To create an user instance which can be resolved by the [identity context](https://www.topaz.sh/docs/authorizer-guide/identity-context) we need to create two objects instances: a `user` object and one or more `identity` objects. This model allows for users to have multiple identities which resolve to a **single** user instance representation.

The two objects are connected by a `identifier` relationship.

### Step 1: create an objects.json file

In order to load objects we first need to create a objects.json file. The filename does not really matter in this case, but the name makes it easier to identify as the container for objects.

The structure looks like this:

```
{
    "objects": [
        {
        	...
        },
        {
        	...
        }   
    ]
}
```

The `objects` key contains an array object instance.

> Note: The key MUST be named "objects"

Next follows a concrete instance, which represents the `user` Rick and his email `identity`.  

#### objects.json

```
{
    "objects": [
        {
            "key": "1234567890",
            "type": "identity",
            "properties": {
                "kind": "IDENTITY_KIND_PID",
                "provider": "auth0",
                "verified": true
            }
        },
        {
            "key": "john.doe@acmecorp.com",
            "type": "user",
            "display_name": "John Doe"
        }   
    ]
}
```

> Note: In order for an identity to be resolvable, the property `verified` must be `true`. When the property is absent or false the identifier will not be evaluated when resolving the identity context.

The full shape of an [object type ](https://buf.build/aserto-dev/directory/docs/main:aserto.directory.common.v2#aserto.directory.common.v2.Object)is documented by the protobuf contract, which is published to our [buf.build](https://buf.build/aserto-dev/directory) repository.
 
#### Step 2: create a relation between the user and its identity 

In order to establish the relationship between the `user` and its `identity` we have to create a relationship of the type `identifier`. 

Lets create a container file named `relations.json` to store our relations. The relations file has a similar structure as the `objects.json` file, where the key is named `relations`, which contains an array of relations.

The relations file structure:

```
{
    "relations": [
        {
        	...
        },
        {
        	...
        }   
    ]
}
```

> Note: The key MUST be named "relations"

#### relations.json

The concrete instance of our relation definition that associates user `Rick` to its email identity `rick@the-citadel.com`, looks like this:

```
{
    "relations": [
        {
            "subject": {
                "type": "user",
                "key": "john.doe@acmecorp.com"
            },
            "relation": "identifier",
            "object": {
                "type": "identity",
                "key": "1234567890"
            }
        }
    ]
}
```

The full shape of an [relation type](https://buf.build/aserto-dev/directory/docs/main:aserto.directory.common.v2#aserto.directory.common.v2.Relation) is documented by the protobuf contract, which is published to our [buf.build](https://buf.build/aserto-dev/directory) repository.

#### Step 3: load the artifacts into topaz

To load the artifacts into topaz execute the following steps:

1. Prerequisite, [setup](https://www.topaz.sh/docs/getting-started) topaz

2. Clone this repo:

```
mkdir -p ~/workspace
cd ~/workspace
git clone https://github.com/gertd/topaz-demos.git
cd ~/workspace/topaz-demos/using-jwt
```

3. Configure your environment

```
topaz configure demo --resource=opcr.io/aserto-templates/policy-template:latest -d -s
```

1.  Load the data

```
topaz import --directory=./data --insecure
```

The result should look like this:

```
❯ topaz import --directory=./data --insecure
>>> importing data from ./data
   object types skipped
    permissions skipped
 relation types skipped
        objects 2
      relations 1
```

#### Step 4: resolve the identity context

To validate if identity resolution works, we will utilize the `query` function in the authorizer. When the authorizer passes in an identity context, the result will be populated in the `input` of the policy execution context.

We can execute the query using the following curl command:

```
curl -k --data "@query.json" -X POST https://localhost:8383/api/v2/authz/query
```

When resolving a JWT token, we need to ensure we use the `"type": "IDENTITY_TYPE_JWT"` in the identity context. To demonstrate this in actionwe will use the JWT token published on [jwt.io](https://jwt.io), and pass the token as part of the query payload, as shown below.


```
{
    "query": "x = input",
    "identity_context": {
        "type": "IDENTITY_TYPE_JWT",
        "identity": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    }
}

```

The result looks like this:

```
{
  "response": {
    "result": [
      {
        "bindings": {
          "x": {
            "identity": {
              "identity": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
              "type": "IDENTITY_TYPE_JWT"
            },
            "user": {
              "created_at": "2022-12-19T20:29:34.711106442Z",
              "deleted_at": null,
              "display_name": "John Doe",
              "hash": "7220429738619844621",
              "id": "e69b5386-94c8-4365-b8b8-3d78bdd5eb22",
              "key": "john.doe@acmecorp.com",
              "properties": {},
              "type": "user",
              "updated_at": "2022-12-19T20:29:34.711106442Z"
            }
          }
        },
        "expressions": [
          {
            "location": {
              "col": 1,
              "row": 1
            },
            "text": "x = input",
            "value": true
          }
        ]
      }
    ]
  },
  "metrics": {},
  "trace": [],
  "trace_summary": []
}
```

The `identity` key contains the identity context passed in by the `query`, the `user` key contains the user properties which are the result of resolving the identity context.
