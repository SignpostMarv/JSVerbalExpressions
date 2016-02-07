module.exports = function gruntConfig(grunt) {
    module.require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        eslint: {
            options: {
                configFile: '.eslintrc',
            },
            target: ['VerbalExpressions.js', 'test/tests.js'],
            Gruntfile: [
                'Gruntfile.js',
            ],
            dynamicTests: [
                'test/dynamic-tests.js',
            ],
        },

        qunit: {
            options: {
                coverage: {
                    src: [
                        'VerbalExpressions.js',
                    ],
                    instrumentedFiles: 'tmp',
                    htmlReport: 'coverage',
                },
            },
            files: [
                'test/index.html',
                'test/dynamic-tests.html',
            ],
        },

        copy: {
            build: {
                src: 'VerbalExpressions.js',
                dest: 'dist/verbalexpressions.js',
            },
        },

        uglify: {
            options: {
                banner: '/*!\n' +
                    '* <%= pkg.name %> JavaScript Library v<%= pkg.version %>\n' +
                    '* <%= pkg.homepage %>\n' +
                    '*\n' +
                    '*\n' +
                    '* Released under the <%= pkg.license %> license\n' +
                    '*\n' +
                    '* Date: <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                    '*\n' +
                    '*/\n',
                sourceMap: true,
            },
            dist: {
                files: {
                    'dist/verbalexpressions.min.js': ['VerbalExpressions.js'],
                },
            },
        },

        sourcemap_localize: {
            options: {
                localize_to: '..',
            },
            build: {
                files: {
                    src: ['dist/*.min.js.map'],
                },
            },
        },

        jsdoc: {
            options: {
                pedantic: true,
                verbose: true,
                readme: 'README.md',
                package: 'package.json',
            },
            src: {
                options: {
                    destination: 'docs',
                },
                src: ['VerbalExpressions.js'],
            },
            dist: {
                options: {
                    destination: 'dist/docs',
                },
                src: ['dist/verbalexpressions.js'],
            },
        },

        watch: {
            testSource: {
                files: [
                    'VerbalExpressions.js',
                    'test/tests.js',
                ],
                tasks: [
                    'test',
                ],
            },
        },
    });

    grunt.registerTask('test', [
        'moduleTest',
        'eslint:target',
        'parseAndCreateTests',
        'eslint:dynamicTests',
        'qunit:files',
    ]);
    grunt.registerTask('default', ['eslint:Gruntfile', 'test']);
    grunt.registerTask('moduleTest', function moduleTest() {
        var VE = new (module.require('./VerbalExpressions.js'));
        VE = VE.whitespace().multiple('').find('not').whitespace().multiple('');
        grunt.log.write(VE.replace('VerbalExpressions as module does not work!', ' '));
    });
    grunt.registerTask('parseAndCreateTests', function parseAndCreateTests() {
        var escodegen = module.require('escodegen');
        var tests = {
            tests: [
                {
                    name: 'getRegex',
                    description: 'Test getRegex',
                    output: {
                        default: '/^[0-9a-zA-Z]+/m',
                        javascript: '/^[0-9a-zA-Z](?:)*/gm',
                    },
                    callStack: [
                        {
                            method: 'startOfLine',
                            arguments: [],
                            returnType: 'sameInstance',
                        },
                        {
                            method: 'range',
                            arguments: [0, 9, 'a', 'z', 'A', 'Z'],
                            returnType: 'sameInstance',
                        },
                        {
                            method: 'multiple',
                            arguments: [''],
                            returnType: 'sameInstance',
                        },
                        {
                            method: 'getRegex',
                            arguments: [],
                            returnType: 'string',
                        },
                    ],
                },
            ],
        };
        var testsAST = {
            type: 'Program',
            body: [],
        };

        grunt.log.writeln('Generating AST');
        tests.tests.forEach(function feTests(test) {
            var output = test.output.default;
            var testAST = {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'test',
                    },
                    arguments: [
                        {
                            type: 'Literal',
                            value: test.name,
                        },
                        {
                            type: 'FunctionExpression',
                            id: {
                                type: 'Identifier',
                                name: (
                                    'test' +
                                    (
                                        test.name.charAt(0).toUpperCase() +
                                        test.name.slice(1)
                                    )
                                ),
                            },
                            params: [
                                {
                                    type: 'Identifier',
                                    name: 'assert',
                                },
                            ],
                            defaults: [],
                            body: {
                                type: 'BlockStatement',
                                body: [
                                    {
                                        type: 'ExpressionStatement',
                                        expression: {
                                            type: 'Literal',
                                            value: 'use strict',
                                        },
                                    },
                                    {
                                        type: 'VariableDeclaration',
                                        kind: 'var',
                                        declarations: [
                                            {
                                                type: 'VariableDeclarator',
                                                id: {
                                                    type: 'Identifier',
                                                    name: 'testRegex',
                                                },
                                                init: {
                                                    type: 'NewExpression',
                                                    callee: {
                                                        type: 'Identifier',
                                                        name: 'VerEx',
                                                    },
                                                    arguments: [],
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        type: 'VariableDeclaration',
                                        kind: 'var',
                                        declarations: [
                                            {
                                                type: 'VariableDeclarator',
                                                id: {
                                                    type: 'Identifier',
                                                    name: 'tmp',
                                                },
                                                init: null,
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    ],
                },
            };
            if (Object.keys(test.output).indexOf('javascript') >= 0) {
                output = test.output.javascript;
            }
            testAST.expression.arguments[1].body.body.push(
                {
                    type: 'VariableDeclaration',
                    kind: 'var',
                    declarations: [
                        {
                            type: 'VariableDeclarator',
                            id: {
                                type: 'Identifier',
                                name: 'output',
                            },
                            init: {
                                type: 'Literal',
                                value: output,
                            },
                        },
                    ],
                }
            );
            test.callStack.forEach(
                function feCallStack(callItem, callItemIndex) {
                    var method = callItem.method;
                    if (method === 'getRegex') {
                        method = 'toString';
                    }
                    if (
                        callItemIndex > 0 &&
                        callItemIndex < (test.callStack.length - 1)
                    ) {
                        testAST.expression.arguments[1].body.body.push(
                            {
                                type: 'ExpressionStatement',
                                expression: {
                                    type: 'AssignmentExpression',
                                    operator: '=',
                                    left: {
                                        type: 'Identifier',
                                        name: 'testRegex',
                                    },
                                    right: {
                                        type: 'Identifier',
                                        name: 'tmp',
                                    },
                                },
                            }
                        );
                    }
                    testAST.expression.arguments[1].body.body.push(
                        {
                            type: 'ExpressionStatement',
                            expression: {
                                type: 'AssignmentExpression',
                                operator: '=',
                                left: {
                                    type: 'Identifier',
                                    name: 'tmp',
                                },
                                right: {
                                    type: 'CallExpression',
                                    callee: {
                                        type: 'MemberExpression',
                                        object: {
                                            type: 'Identifier',
                                            name: 'testRegex',
                                        },
                                        property: {
                                            type: 'Identifier',
                                            name: method,
                                        },
                                    },
                                    arguments: callItem.arguments.map(
                                        function mapArguments(argument) {
                                            return {
                                                type: 'Literal',
                                                value: argument,
                                            };
                                        }
                                    ),
                                },
                            },
                        }
                    );
                    if (callItem.returnType === 'sameInstance') {
                        testAST.expression.arguments[1].body.body.push(
                            {
                                type: 'ExpressionStatement',
                                expression: {
                                    type: 'CallExpression',
                                    callee: {
                                        type: 'MemberExpression',
                                        object: {
                                            type: 'Identifier',
                                            name: 'assert',
                                        },
                                        property: {
                                            type: 'Identifier',
                                            name: 'ok',
                                        },
                                    },
                                    arguments: [
                                        {
                                            type: 'BinaryExpression',
                                            operator: 'instanceof',
                                            left: {
                                                type: 'Identifier',
                                                name: 'tmp',
                                            },
                                            right: {
                                                type: 'Identifier',
                                                name: 'RegExp',
                                            },
                                        },
                                        {
                                            type: 'Literal',
                                            value: 'Should be an instanceof RegExp',
                                        },
                                    ],
                                },
                            },
                            {
                                type: 'ExpressionStatement',
                                expression: {
                                    type: 'CallExpression',
                                    callee: {
                                        type: 'MemberExpression',
                                        object: {
                                            type: 'Identifier',
                                            name: 'assert',
                                        },
                                        property: {
                                            type: 'Identifier',
                                            name: 'strictEqual',
                                        },
                                    },
                                    arguments: [
                                        {
                                            type: 'Identifier',
                                            name: 'tmp',
                                        },
                                        {
                                            type: 'Identifier',
                                            name: 'testRegex',
                                        },
                                        {
                                            type: 'Literal',
                                            value: 'Should be same instance',
                                        },
                                    ],
                                },
                            }
                        );
                    } else {
                        testAST.expression.arguments[1].body.body.push(
                            {
                                type: 'ExpressionStatement',
                                expression: {
                                    type: 'CallExpression',
                                    callee: {
                                        type: 'MemberExpression',
                                        object: {
                                            type: 'Identifier',
                                            name: 'assert',
                                        },
                                        property: {
                                            type: 'Identifier',
                                            name: 'equal',
                                        },
                                    },
                                    arguments: [
                                        {
                                            type: 'UnaryExpression',
                                            operator: 'typeof',
                                            argument: {
                                                type: 'Identifier',
                                                name: 'tmp',
                                            },
                                        },
                                        {
                                            type: 'Literal',
                                            value: callItem.returnType,
                                        },
                                        {
                                            type: 'Literal',
                                            value: (
                                                'Result of ' +
                                                method +
                                                ' should be a ' +
                                                callItem.returnType
                                            ),
                                        },
                                    ],
                                },
                            }
                        );
                    }
                }
            );

            testAST.expression.arguments[1].body.body.push(
                {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'MemberExpression',
                            object: {
                                type: 'Identifier',
                                name: 'assert',
                            },
                            property: {
                                type: 'Identifier',
                                name: 'equal',
                            },
                        },
                        arguments: [
                            {
                                type: 'Identifier',
                                name: 'tmp',
                            },
                            {
                                type: 'Identifier',
                                name: 'output',
                            },
                            {
                                type: 'Literal',
                                value: 'Expected output should be "' + output + '"',
                            },
                        ],
                    },
                }
            );
            testsAST.body.push(testAST);
        });
        grunt.log.writeln('Compiling AST to file');
        grunt.file.write(
            'test/dynamic-tests.js',
            (escodegen.generate(testsAST) + '\n')
        );
    });
    grunt.registerTask('build', [
        'eslint:target',
        'qunit:files',
        'copy:build',
        'uglify:dist',
        'sourcemap_localize:build',
        'jsdoc:dist',
    ]);
};
