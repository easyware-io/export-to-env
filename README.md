# danilokorber/export-to-env@v1

<a href="https://github.com/danilokorber/export-to-env/actions"><img alt="export-to-env status" src="https://github.com/danilokorber/export-to-env/workflows/build-test/badge.svg"></a>

Using GitHub variables and secrets can be confusing, when you don't know in which context a given variable is.
Also importing one by one can be a big effort, depending on the amount of variables you have. To make life easier, with this you can export all (or just some) of the variables into the workflow `env` context, making it easily accessible with `${{ env.VARIABLE }}`.

**Let's move from this ...**

```yaml
- run: echo "Value of MY_SECRET1: $MY_SECRET1"
  env:
    MY_SECRET1: ${{ secrets.MY_SECRET1 }}
    MY_SECRET2: ${{ secrets.MY_SECRET2 }}
    MY_SECRET3: ${{ secrets.MY_SECRET3 }}
    MY_SECRET4: ${{ secrets.MY_SECRET4 }}
    MY_SECRET5: ${{ secrets.MY_SECRET5 }}
    MY_SECRET6: ${{ secrets.MY_SECRET6 }}
    ...
```

**... to this**

```yaml
- uses: danilokorber/export-to-env@v1
  with:
    secrets: ${{ toJSON(secrets) }}
```

## Usage

### Basic usage

```yaml
- name: Export secrets and vars to local env
  uses: danilokorber/export-to-env@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    vars: ${{ toJSON(vars) }}
```

:warning: Unfortunately the action script itself does not have access to the variables in your repo. That's why you need to pass them as a JSON. You can inform both `vars` and `secrets` or just one of them. Informing none will not do anything.

### Optional params

#### `except`

```yaml
- uses: danilokorber/export-to-env@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    except: MY_SECRET, DB_* # (comma separated, supports regex)
    # MY_SECRET any anything starting with DB_ will not be exported
```

#### `only`

```yaml
- uses: danilokorber/export-to-env@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    only: MY_SECRET, DB* # (comma separated, supports regex)
    # only MY_SECRET any anything starting with DB_ will be exported. The rest is ignored
```

#### `prefix`

```yaml
- uses: danilokorber/export-to-env@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    prefix: PREFIXED_ # (string)
    # MY_SECRET will be exported as PREFIXED_MY_SECRET
```

#### `suffix`

```yaml
- uses: danilokorber/export-to-env@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    suffix: _SUFFIXED # (string)
    # MY_SECRET will be exported as MY_SECRET_SUFFIXED
```

#### `override`

```yaml
env:
  MY_SECRET: DONT_OVERRIDE
steps:
- uses: danilokorber/export-to-env@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    override: false # (boolean) default: false
- run: echo "Value of MY_SECRET: $MY_SECRET"
  # Value of MY_SECRET: DONT_OVERRIDE
```

#### `transform`

```yaml
- uses: danilokorber/export-to-env@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    transform: lowercase # (lowercase | uppercase | camelcase | constant | pascalcase | pascalSnakeCase | snakecase)
    # Will be accessible with $my_secret
```

#### `transformPrefix`, `transformSuffix`

```yaml
- uses: danilokorber/export-to-env@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    prefix: PREFIXED_
    transform: lower
    transformPrefix: false # (boolean) default: true
    # MY_SECRET would become PREFIXED_my_secret
```

#### `convert`

```yaml
- uses: danilokorber/export-to-env@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    convert: 'base64' # (base64 | utf8)
    # MY_SECRET will be exported converted to a base64 string.
    # AFFECTS ONLY SECRETS. vars are always exported as plain text.
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

## Contributions

Contributions are welcome!

## Inspiration

Inspired by [oNaiPs/secrets-to-env-action](https://github.com/oNaiPs/secrets-to-env-action)
